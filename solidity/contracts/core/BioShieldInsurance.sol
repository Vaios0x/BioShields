// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "../libraries/SafeMath.sol";
import "../libraries/PremiumCalculator.sol";
import "../libraries/RiskAssessment.sol";

/**
 * @title BioShieldInsurance
 * @dev Main insurance contract for parametric insurance on Base network
 * @author BioShield Team
 */
contract BioShieldInsurance is 
    PausableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    AutomationCompatibleInterface
{
    using SafeMath for uint256;
    using PremiumCalculator for uint256;
    using RiskAssessment for RiskProfile;

    // ========== CONSTANTS ==========
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    uint256 public constant LIVES_DISCOUNT_PERCENTAGE = 50; // 50% discount
    uint256 public constant MAX_COVERAGE_PERIOD = 365 days;
    uint256 public constant MIN_COVERAGE_AMOUNT = 1000 * 10**18; // $1000
    uint256 public constant MAX_COVERAGE_AMOUNT = 15000000 * 10**18; // $15M
    uint256 public constant BASIS_POINTS = 10000;
    
    // ========== STATE VARIABLES ==========
    
    // Core addresses
    address public livesToken;
    address public shieldToken;
    address public coverageNFT;
    address public insurancePool;
    address public treasury;
    address public chainlinkOracle;
    
    // Pool parameters
    uint256 public totalValueLocked;
    uint256 public totalCoverageAmount;
    uint256 public totalClaimsPaid;
    uint256 public poolFeePercentage;
    
    // Coverage tracking
    uint256 public nextCoverageId;
    mapping(uint256 => Coverage) public coverages;
    mapping(address => uint256[]) public userCoverages;
    mapping(uint256 => Claim[]) public coverageClaims;
    
    // Risk pools
    mapping(RiskCategory => RiskPool) public riskPools;
    
    // Oracle data
    mapping(bytes32 => OracleRequest) public oracleRequests;
    
    // ========== STRUCTS ==========
    
    struct Coverage {
        uint256 id;
        address insured;
        uint256 coverageAmount;
        uint256 premiumPaid;
        CoverageType coverageType;
        TriggerConditions triggerConditions;
        uint256 startTime;
        uint256 endTime;
        CoverageStatus status;
        uint256 claimsMade;
        uint256 totalClaimed;
        string metadataURI;
        bool paidWithLives;
    }
    
    struct TriggerConditions {
        bool clinicalTrialFailure;
        bool regulatoryRejection;
        bool ipInvalidation;
        uint256 minimumThreshold;
        bytes32 customConditionsHash;
    }
    
    struct Claim {
        uint256 id;
        uint256 coverageId;
        address claimant;
        uint256 claimAmount;
        ClaimType claimType;
        bytes32 evidenceHash;
        bytes32 oracleRequestId;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 processedAt;
        address processor;
        string rejectionReason;
    }
    
    struct RiskPool {
        uint256 totalLiquidity;
        uint256 utilizationRate;
        uint256 basePremiumRate;
        uint256 minCoverage;
        uint256 maxCoverage;
        bool isActive;
    }
    
    struct OracleRequest {
        uint256 claimId;
        address requester;
        uint256 timestamp;
        bool fulfilled;
        bytes response;
    }
    
    struct RiskProfile {
        RiskCategory category;
        uint256 score;
        uint256 multiplier;
        bytes32 dataHash;
    }
    
    // ========== ENUMS ==========
    
    enum CoverageType {
        ClinicalTrialFailure,
        RegulatoryRejection,
        IpInvalidation,
        ResearchInfrastructure,
        Custom
    }
    
    enum CoverageStatus {
        Active,
        Expired,
        Exhausted,
        Cancelled
    }
    
    enum ClaimType {
        FullCoverage,
        PartialCoverage,
        Milestone
    }
    
    enum ClaimStatus {
        Pending,
        UnderReview,
        Approved,
        Rejected,
        Paid
    }
    
    enum RiskCategory {
        Low,
        Medium,
        High,
        VeryHigh
    }
    
    // ========== EVENTS ==========
    
    event CoverageCreated(
        uint256 indexed coverageId,
        address indexed insured,
        uint256 coverageAmount,
        uint256 premium,
        CoverageType coverageType,
        bool paidWithLives
    );
    
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed coverageId,
        address indexed claimant,
        uint256 amount
    );
    
    event ClaimProcessed(
        uint256 indexed claimId,
        ClaimStatus status,
        uint256 payoutAmount
    );
    
    event LiquidityAdded(
        address indexed provider,
        uint256 amount,
        uint256 lpTokensMinted
    );
    
    event OracleRequestCreated(
        bytes32 indexed requestId,
        uint256 claimId
    );
    
    // ========== MODIFIERS ==========
    
    modifier onlyValidCoverage(uint256 amount, uint256 period) {
        require(
            amount >= MIN_COVERAGE_AMOUNT && amount <= MAX_COVERAGE_AMOUNT,
            "Invalid coverage amount"
        );
        require(period <= MAX_COVERAGE_PERIOD, "Coverage period too long");
        _;
    }
    
    modifier coverageExists(uint256 coverageId) {
        require(coverages[coverageId].id != 0, "Coverage does not exist");
        _;
    }
    
    modifier onlyInsured(uint256 coverageId) {
        require(
            coverages[coverageId].insured == msg.sender,
            "Not the insured"
        );
        _;
    }
    
    // ========== INITIALIZATION ==========
    
    function initialize(
        address _livesToken,
        address _shieldToken,
        address _coverageNFT,
        address _insurancePool,
        address _treasury,
        address _chainlinkOracle
    ) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        livesToken = _livesToken;
        shieldToken = _shieldToken;
        coverageNFT = _coverageNFT;
        insurancePool = _insurancePool;
        treasury = _treasury;
        chainlinkOracle = _chainlinkOracle;
        
        poolFeePercentage = 200; // 2%
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        // Initialize risk pools
        _initializeRiskPools();
    }
    
    // ========== CORE FUNCTIONS ==========
    
    function createCoverage(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        CoverageType coverageType,
        TriggerConditions calldata triggerConditions,
        bool payWithLives,
        string calldata metadataURI
    ) external payable nonReentrant whenNotPaused 
      onlyValidCoverage(coverageAmount, coveragePeriod) 
      returns (uint256) {
        
        // Calculate risk profile
        RiskProfile memory riskProfile = _assessRisk(
            coverageType,
            coverageAmount,
            coveragePeriod
        );
        
        // Calculate premium
        uint256 basePremium = PremiumCalculator.calculate(
            coverageAmount,
            coveragePeriod,
            riskProfile
        );
        
        uint256 finalPremium = basePremium;
        if (payWithLives) {
            // Apply LIVES token discount
            finalPremium = basePremium.mul(100 - LIVES_DISCOUNT_PERCENTAGE).div(100);
            
            // Transfer LIVES tokens
            require(
                IERC20(livesToken).transferFrom(
                    msg.sender,
                    insurancePool,
                    finalPremium
                ),
                "LIVES transfer failed"
            );
        } else {
            // Transfer ETH/USDC
            require(msg.value >= finalPremium, "Insufficient payment");
            if (msg.value > finalPremium) {
                // Refund excess
                payable(msg.sender).transfer(msg.value - finalPremium);
            }
        }
        
        // Create coverage
        uint256 coverageId = ++nextCoverageId;
        
        Coverage storage coverage = coverages[coverageId];
        coverage.id = coverageId;
        coverage.insured = msg.sender;
        coverage.coverageAmount = coverageAmount;
        coverage.premiumPaid = finalPremium;
        coverage.coverageType = coverageType;
        coverage.triggerConditions = triggerConditions;
        coverage.startTime = block.timestamp;
        coverage.endTime = block.timestamp + coveragePeriod;
        coverage.status = CoverageStatus.Active;
        coverage.metadataURI = metadataURI;
        coverage.paidWithLives = payWithLives;
        
        // Mint NFT
        ICoverageNFT(coverageNFT).mint(msg.sender, coverageId, metadataURI);
        
        // Update user coverages
        userCoverages[msg.sender].push(coverageId);
        
        // Update pool statistics
        totalCoverageAmount = totalCoverageAmount.add(coverageAmount);
        totalValueLocked = totalValueLocked.add(finalPremium);
        
        // Update risk pool
        RiskCategory riskCategory = riskProfile.category;
        riskPools[riskCategory].utilizationRate = _calculateUtilization(riskCategory);
        
        emit CoverageCreated(
            coverageId,
            msg.sender,
            coverageAmount,
            finalPremium,
            coverageType,
            payWithLives
        );
        
        return coverageId;
    }
    
    function submitClaim(
        uint256 coverageId,
        uint256 claimAmount,
        ClaimType claimType,
        bytes32 evidenceHash,
        string calldata evidenceURI
    ) external nonReentrant whenNotPaused 
      coverageExists(coverageId) 
      onlyInsured(coverageId) 
      returns (uint256) {
        
        Coverage storage coverage = coverages[coverageId];
        
        require(coverage.status == CoverageStatus.Active, "Coverage not active");
        require(block.timestamp <= coverage.endTime, "Coverage expired");
        require(
            claimAmount <= coverage.coverageAmount.sub(coverage.totalClaimed),
            "Claim exceeds remaining coverage"
        );
        
        // Create claim
        uint256 claimId = coverageClaims[coverageId].length;
        
        Claim memory newClaim = Claim({
            id: claimId,
            coverageId: coverageId,
            claimant: msg.sender,
            claimAmount: claimAmount,
            claimType: claimType,
            evidenceHash: evidenceHash,
            oracleRequestId: bytes32(0),
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            processedAt: 0,
            processor: address(0),
            rejectionReason: ""
        });
        
        coverageClaims[coverageId].push(newClaim);
        
        // Create oracle request for verification
        bytes32 requestId = _requestOracleVerification(
            coverageId,
            claimId,
            evidenceHash
        );
        
        coverageClaims[coverageId][claimId].oracleRequestId = requestId;
        
        emit ClaimSubmitted(claimId, coverageId, msg.sender, claimAmount);
        
        return claimId;
    }
    
    function processClaimWithOracle(
        uint256 coverageId,
        uint256 claimId,
        bytes calldata oracleResponse
    ) external nonReentrant 
      hasRole(ORACLE_ROLE) 
      coverageExists(coverageId) {
        
        Claim storage claim = coverageClaims[coverageId][claimId];
        Coverage storage coverage = coverages[coverageId];
        
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        
        // Parse oracle response
        (bool isValid, uint256 verifiedAmount) = _parseOracleResponse(oracleResponse);
        
        if (isValid && _verifyTriggerConditions(coverage, oracleResponse)) {
            // Calculate payout
            uint256 payoutAmount = Math.min(
                verifiedAmount,
                coverage.coverageAmount.sub(coverage.totalClaimed)
            );
            
            // Update claim status
            claim.status = ClaimStatus.Approved;
            claim.processedAt = block.timestamp;
            claim.processor = msg.sender;
            
            // Update coverage
            coverage.claimsMade = coverage.claimsMade.add(1);
            coverage.totalClaimed = coverage.totalClaimed.add(payoutAmount);
            
            if (coverage.totalClaimed >= coverage.coverageAmount) {
                coverage.status = CoverageStatus.Exhausted;
            }
            
            // Process payout
            _processPayout(claim.claimant, payoutAmount, coverage.paidWithLives);
            
            // Update pool statistics
            totalClaimsPaid = totalClaimsPaid.add(payoutAmount);
            
            emit ClaimProcessed(claimId, ClaimStatus.Approved, payoutAmount);
        } else {
            claim.status = ClaimStatus.Rejected;
            claim.processedAt = block.timestamp;
            claim.processor = msg.sender;
            claim.rejectionReason = "Oracle verification failed";
            
            emit ClaimProcessed(claimId, ClaimStatus.Rejected, 0);
        }
    }
    
    // ========== LIQUIDITY FUNCTIONS ==========
    
    function addLiquidity(uint256 amount, bool useLives) 
        external payable nonReentrant whenNotPaused {
        
        uint256 actualAmount;
        
        if (useLives) {
            require(
                IERC20(livesToken).transferFrom(msg.sender, insurancePool, amount),
                "LIVES transfer failed"
            );
            actualAmount = amount;
        } else {
            require(msg.value >= amount, "Insufficient ETH");
            actualAmount = msg.value;
        }
        
        // Calculate LP tokens to mint
        uint256 lpTokens = _calculateLPTokens(actualAmount);
        
        // Mint LP tokens
        IInsuranceLP(insurancePool).mint(msg.sender, lpTokens);
        
        // Update TVL
        totalValueLocked = totalValueLocked.add(actualAmount);
        
        emit LiquidityAdded(msg.sender, actualAmount, lpTokens);
    }
    
    function removeLiquidity(uint256 lpTokenAmount) 
        external nonReentrant whenNotPaused {
        
        // Calculate withdrawal amount
        uint256 withdrawAmount = _calculateWithdrawalAmount(lpTokenAmount);
        
        // Check available liquidity
        require(
            withdrawAmount <= _getAvailableLiquidity(),
            "Insufficient liquidity"
        );
        
        // Burn LP tokens
        IInsuranceLP(insurancePool).burn(msg.sender, lpTokenAmount);
        
        // Transfer funds
        payable(msg.sender).transfer(withdrawAmount);
        
        // Update TVL
        totalValueLocked = totalValueLocked.sub(withdrawAmount);
    }
    
    // ========== CHAINLINK AUTOMATION ==========
    
    function checkUpkeep(bytes calldata checkData) 
        external view override 
        returns (bool upkeepNeeded, bytes memory performData) {
        
        // Check for expired coverages
        uint256[] memory expiredCoverages = _getExpiredCoverages();
        
        // Check for pending claims that need oracle verification
        uint256[] memory pendingClaims = _getPendingClaims();
        
        upkeepNeeded = expiredCoverages.length > 0 || pendingClaims.length > 0;
        performData = abi.encode(expiredCoverages, pendingClaims);
    }
    
    function performUpkeep(bytes calldata performData) external override {
        (uint256[] memory expiredCoverages, uint256[] memory pendingClaims) = 
            abi.decode(performData, (uint256[], uint256[]));
        
        // Process expired coverages
        for (uint256 i = 0; i < expiredCoverages.length; i++) {
            _expireCoverage(expiredCoverages[i]);
        }
        
        // Request oracle verification for pending claims
        for (uint256 i = 0; i < pendingClaims.length; i++) {
            _requestOracleVerification(
                pendingClaims[i] >> 128,  // Coverage ID
                uint128(pendingClaims[i]), // Claim ID
                bytes32(0)
            );
        }
    }
    
    // ========== INTERNAL FUNCTIONS ==========
    
    function _initializeRiskPools() internal {
        riskPools[RiskCategory.Low] = RiskPool({
            totalLiquidity: 0,
            utilizationRate: 0,
            basePremiumRate: 300,  // 3%
            minCoverage: 1000 * 10**18,
            maxCoverage: 1000000 * 10**18,
            isActive: true
        });
        
        riskPools[RiskCategory.Medium] = RiskPool({
            totalLiquidity: 0,
            utilizationRate: 0,
            basePremiumRate: 500,  // 5%
            minCoverage: 5000 * 10**18,
            maxCoverage: 5000000 * 10**18,
            isActive: true
        });
        
        riskPools[RiskCategory.High] = RiskPool({
            totalLiquidity: 0,
            utilizationRate: 0,
            basePremiumRate: 800,  // 8%
            minCoverage: 10000 * 10**18,
            maxCoverage: 10000000 * 10**18,
            isActive: true
        });
        
        riskPools[RiskCategory.VeryHigh] = RiskPool({
            totalLiquidity: 0,
            utilizationRate: 0,
            basePremiumRate: 1200, // 12%
            minCoverage: 50000 * 10**18,
            maxCoverage: 15000000 * 10**18,
            isActive: true
        });
    }
    
    function _assessRisk(
        CoverageType coverageType,
        uint256 amount,
        uint256 period
    ) internal view returns (RiskProfile memory) {
        // Complex risk assessment logic
        uint256 score = 0;
        
        // Base score from coverage type
        if (coverageType == CoverageType.ClinicalTrialFailure) {
            score = 70; // High risk
        } else if (coverageType == CoverageType.RegulatoryRejection) {
            score = 60; // Medium-high risk
        } else if (coverageType == CoverageType.IpInvalidation) {
            score = 50; // Medium risk
        } else {
            score = 40; // Lower risk
        }
        
        // Adjust for amount
        if (amount > 10000000 * 10**18) {
            score = score.add(20);
        } else if (amount > 5000000 * 10**18) {
            score = score.add(10);
        }
        
        // Adjust for period
        if (period > 180 days) {
            score = score.add(10);
        }
        
        // Determine category
        RiskCategory category;
        if (score < 40) {
            category = RiskCategory.Low;
        } else if (score < 60) {
            category = RiskCategory.Medium;
        } else if (score < 80) {
            category = RiskCategory.High;
        } else {
            category = RiskCategory.VeryHigh;
        }
        
        return RiskProfile({
            category: category,
            score: score,
            multiplier: riskPools[category].basePremiumRate,
            dataHash: keccak256(abi.encode(coverageType, amount, period))
        });
    }
    
    function _requestOracleVerification(
        uint256 coverageId,
        uint256 claimId,
        bytes32 evidenceHash
    ) internal returns (bytes32) {
        // Create Chainlink request
        bytes32 requestId = keccak256(
            abi.encode(coverageId, claimId, block.timestamp)
        );
        
        oracleRequests[requestId] = OracleRequest({
            claimId: (coverageId << 128) | claimId,
            requester: msg.sender,
            timestamp: block.timestamp,
            fulfilled: false,
            response: ""
        });
        
        // Call Chainlink oracle
        IChainlinkOracle(chainlinkOracle).requestVerification(
            requestId,
            evidenceHash
        );
        
        emit OracleRequestCreated(requestId, claimId);
        
        return requestId;
    }
    
    function _verifyTriggerConditions(
        Coverage storage coverage,
        bytes memory oracleData
    ) internal view returns (bool) {
        // Decode oracle data and verify against trigger conditions
        // Implementation depends on specific oracle response format
        return true; // Placeholder
    }
    
    function _processPayout(
        address recipient,
        uint256 amount,
        bool inLives
    ) internal {
        if (inLives) {
            require(
                IERC20(livesToken).transfer(recipient, amount),
                "LIVES payout failed"
            );
        } else {
            payable(recipient).transfer(amount);
        }
    }
    
    function _calculateLPTokens(uint256 amount) internal view returns (uint256) {
        uint256 totalSupply = IInsuranceLP(insurancePool).totalSupply();
        
        if (totalSupply == 0) {
            return amount; // 1:1 for first deposit
        }
        
        return amount.mul(totalSupply).div(totalValueLocked);
    }
    
    function _calculateWithdrawalAmount(uint256 lpTokens) 
        internal view returns (uint256) {
        uint256 totalSupply = IInsuranceLP(insurancePool).totalSupply();
        return lpTokens.mul(totalValueLocked).div(totalSupply);
    }
    
    function _calculateUtilization(RiskCategory category) 
        internal view returns (uint256) {
        // Calculate utilization rate for risk pool
        return 0; // Placeholder
    }
    
    function _getAvailableLiquidity() internal view returns (uint256) {
        // Calculate available liquidity considering active coverages
        return totalValueLocked.sub(totalCoverageAmount.mul(20).div(100));
    }
    
    function _getExpiredCoverages() internal view returns (uint256[] memory) {
        // Get list of expired coverages
        uint256[] memory expired = new uint256[](10);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= nextCoverageId && count < 10; i++) {
            if (coverages[i].status == CoverageStatus.Active &&
                coverages[i].endTime < block.timestamp) {
                expired[count++] = i;
            }
        }
        
        return expired;
    }
    
    function _getPendingClaims() internal view returns (uint256[] memory) {
        // Get list of pending claims
        uint256[] memory pending = new uint256[](10);
        // Implementation
        return pending;
    }
    
    function _expireCoverage(uint256 coverageId) internal {
        Coverage storage coverage = coverages[coverageId];
        if (coverage.status == CoverageStatus.Active &&
            coverage.endTime < block.timestamp) {
            coverage.status = CoverageStatus.Expired;
        }
    }
    
    function _parseOracleResponse(bytes memory response) 
        internal pure returns (bool isValid, uint256 amount) {
        // Parse oracle response
        return (true, 0); // Placeholder
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }
    
    function updatePoolFee(uint256 newFee) external onlyRole(GOVERNANCE_ROLE) {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        poolFeePercentage = newFee;
    }
    
    function _authorizeUpgrade(address newImplementation) 
        internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}

// =====================================
// INTERFACES
// =====================================

interface ICoverageNFT {
    function mint(address to, uint256 tokenId, string calldata uri) external;
}

interface IInsuranceLP {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

interface IChainlinkOracle {
    function requestVerification(bytes32 requestId, bytes32 evidenceHash) external;
}
