// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleBioShield
 * @dev Simplified version of BioShield Insurance for testing deployment
 */
contract SimpleBioShield is Ownable, ReentrancyGuard {
    
    // Events
    event InsurancePoolCreated(uint256 indexed poolId, string name, uint256 capacity);
    event CoveragePurchased(uint256 indexed coverageId, address indexed user, uint256 amount);
    event ClaimSubmitted(uint256 indexed claimId, address indexed user, uint256 amount);
    
    // Structs
    struct InsurancePool {
        uint256 id;
        string name;
        string description;
        uint256 capacity;
        uint256 premiumRate; // in basis points (10000 = 100%)
        uint256 coveragePeriod;
        bool active;
        address creator;
    }
    
    struct Coverage {
        uint256 id;
        address user;
        uint256 poolId;
        uint256 amount;
        uint256 premium;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }
    
    struct Claim {
        uint256 id;
        address user;
        uint256 coverageId;
        uint256 amount;
        string reason;
        bool approved;
        bool processed;
    }
    
    // State variables
    uint256 public nextPoolId = 1;
    uint256 public nextCoverageId = 1;
    uint256 public nextClaimId = 1;
    
    mapping(uint256 => InsurancePool) public pools;
    mapping(uint256 => Coverage) public coverages;
    mapping(uint256 => Claim) public claims;
    
    address public livesToken;
    address public shieldToken;
    
    // Constructor
    constructor(address _livesToken, address _shieldToken) Ownable(msg.sender) {
        livesToken = _livesToken;
        shieldToken = _shieldToken;
    }
    
    // Functions
    function createInsurancePool(
        string memory _name,
        string memory _description,
        uint256 _capacity,
        uint256 _premiumRate,
        uint256 _coveragePeriod
    ) external onlyOwner returns (uint256) {
        require(_capacity > 0, "Capacity must be greater than 0");
        require(_premiumRate <= 10000, "Premium rate cannot exceed 100%");
        require(_coveragePeriod > 0, "Coverage period must be greater than 0");
        
        uint256 poolId = nextPoolId++;
        
        pools[poolId] = InsurancePool({
            id: poolId,
            name: _name,
            description: _description,
            capacity: _capacity,
            premiumRate: _premiumRate,
            coveragePeriod: _coveragePeriod,
            active: true,
            creator: msg.sender
        });
        
        emit InsurancePoolCreated(poolId, _name, _capacity);
        return poolId;
    }
    
    function purchaseCoverage(
        uint256 _poolId,
        uint256 _amount
    ) external nonReentrant returns (uint256) {
        InsurancePool memory pool = pools[_poolId];
        require(pool.active, "Pool is not active");
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= pool.capacity, "Amount exceeds pool capacity");
        
        uint256 premium = (_amount * pool.premiumRate) / 10000;
        
        // Transfer premium from user to contract
        IERC20(shieldToken).transferFrom(msg.sender, address(this), premium);
        
        uint256 coverageId = nextCoverageId++;
        
        coverages[coverageId] = Coverage({
            id: coverageId,
            user: msg.sender,
            poolId: _poolId,
            amount: _amount,
            premium: premium,
            startTime: block.timestamp,
            endTime: block.timestamp + pool.coveragePeriod,
            active: true
        });
        
        emit CoveragePurchased(coverageId, msg.sender, _amount);
        return coverageId;
    }
    
    function submitClaim(
        uint256 _coverageId,
        uint256 _amount,
        string memory _reason
    ) external returns (uint256) {
        Coverage memory coverage = coverages[_coverageId];
        require(coverage.user == msg.sender, "Not the coverage owner");
        require(coverage.active, "Coverage is not active");
        require(block.timestamp <= coverage.endTime, "Coverage has expired");
        require(_amount <= coverage.amount, "Claim amount exceeds coverage");
        
        uint256 claimId = nextClaimId++;
        
        claims[claimId] = Claim({
            id: claimId,
            user: msg.sender,
            coverageId: _coverageId,
            amount: _amount,
            reason: _reason,
            approved: false,
            processed: false
        });
        
        emit ClaimSubmitted(claimId, msg.sender, _amount);
        return claimId;
    }
    
    function approveClaim(uint256 _claimId) external onlyOwner {
        Claim storage claim = claims[_claimId];
        require(!claim.processed, "Claim already processed");
        
        claim.approved = true;
        claim.processed = true;
        
        // Transfer claim amount to user
        IERC20(shieldToken).transfer(claim.user, claim.amount);
    }
    
    function rejectClaim(uint256 _claimId) external onlyOwner {
        Claim storage claim = claims[_claimId];
        require(!claim.processed, "Claim already processed");
        
        claim.approved = false;
        claim.processed = true;
    }
    
    // View functions
    function getPool(uint256 _poolId) external view returns (InsurancePool memory) {
        return pools[_poolId];
    }
    
    function getCoverage(uint256 _coverageId) external view returns (Coverage memory) {
        return coverages[_coverageId];
    }
    
    function getClaim(uint256 _claimId) external view returns (Claim memory) {
        return claims[_claimId];
    }
    
    function getPoolCount() external view returns (uint256) {
        return nextPoolId - 1;
    }
    
    function getCoverageCount() external view returns (uint256) {
        return nextCoverageId - 1;
    }
    
    function getClaimCount() external view returns (uint256) {
        return nextClaimId - 1;
    }
}
