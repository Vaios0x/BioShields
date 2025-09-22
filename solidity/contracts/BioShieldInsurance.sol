// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BioShieldInsurance
 * @dev Complete BioShield Insurance contract with policy creation and LIVES token integration
 */
contract BioShieldInsurance is Ownable, ReentrancyGuard {
    
    // Events
    event PolicyCreated(uint256 indexed policyId, address indexed user, uint256 coverageAmount, uint256 premium);
    event ClaimSubmitted(uint256 indexed claimId, address indexed user, uint256 policyId, string evidence);
    event ClaimProcessed(uint256 indexed claimId, bool approved, uint256 payout);
    
    // Structs
    struct Policy {
        uint256 id;
        address user;
        uint256 coverageAmount;
        uint256 premium;
        uint256 startDate;
        uint256 endDate;
        uint8 status; // 0: Active, 1: Expired, 2: Cancelled
        string triggerConditions;
        bool payWithLives;
        uint256 livesDiscount;
    }
    
    struct Claim {
        uint256 id;
        address user;
        uint256 policyId;
        string evidence;
        uint256 amount;
        bool processed;
        bool approved;
        uint256 payout;
    }
    
    struct PoolStats {
        uint256 totalLiquidity;
        uint256 activePolicies;
        uint256 totalClaims;
        uint256 averageApy;
    }
    
    // State variables
    uint256 public nextPolicyId = 1;
    uint256 public nextClaimId = 1;
    
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public userPolicies;
    
    address public livesToken;
    address public shieldToken;
    
    uint256 public constant LIVES_DISCOUNT_PERCENTAGE = 50; // 50% discount
    uint256 public constant BASIS_POINTS = 10000;
    
    // Constructor
    constructor(address _livesToken, address _shieldToken) Ownable(msg.sender) {
        livesToken = _livesToken;
        shieldToken = _shieldToken;
    }
    
    // Main function to create a policy
    function createPolicy(
        uint256 coverageAmount,
        uint256 premium,
        string memory triggerConditions
    ) external nonReentrant returns (uint256) {
        require(coverageAmount > 0, "Coverage amount must be greater than 0");
        require(premium > 0, "Premium must be greater than 0");
        require(bytes(triggerConditions).length > 0, "Trigger conditions required");
        
        uint256 policyId = nextPolicyId++;
        uint256 finalPremium = premium;
        bool payWithLives = false;
        uint256 livesDiscount = 0;
        
        // Check if user wants to pay with LIVES for discount
        // This would be determined by the frontend and passed as a parameter
        // For now, we'll implement the logic to check LIVES balance and apply discount
        
        // Transfer premium payment
        IERC20(shieldToken).transferFrom(msg.sender, address(this), finalPremium);
        
        policies[policyId] = Policy({
            id: policyId,
            user: msg.sender,
            coverageAmount: coverageAmount,
            premium: finalPremium,
            startDate: block.timestamp,
            endDate: block.timestamp + 365 days, // 1 year coverage
            status: 0, // Active
            triggerConditions: triggerConditions,
            payWithLives: payWithLives,
            livesDiscount: livesDiscount
        });
        
        userPolicies[msg.sender].push(policyId);
        
        emit PolicyCreated(policyId, msg.sender, coverageAmount, finalPremium);
        return policyId;
    }
    
    // Function to create policy with LIVES discount
    function createPolicyWithLives(
        uint256 coverageAmount,
        uint256 premium,
        string memory triggerConditions,
        uint256 livesAmount
    ) external nonReentrant returns (uint256) {
        require(coverageAmount > 0, "Coverage amount must be greater than 0");
        require(premium > 0, "Premium must be greater than 0");
        require(bytes(triggerConditions).length > 0, "Trigger conditions required");
        require(livesAmount > 0, "LIVES amount must be greater than 0");
        
        uint256 policyId = nextPolicyId++;
        uint256 discount = (premium * LIVES_DISCOUNT_PERCENTAGE) / 100;
        uint256 finalPremium = premium - discount;
        
        // Transfer LIVES tokens for discount
        IERC20(livesToken).transferFrom(msg.sender, address(this), livesAmount);
        
        // Transfer remaining premium in SHIELD tokens
        if (finalPremium > 0) {
            IERC20(shieldToken).transferFrom(msg.sender, address(this), finalPremium);
        }
        
        policies[policyId] = Policy({
            id: policyId,
            user: msg.sender,
            coverageAmount: coverageAmount,
            premium: premium,
            startDate: block.timestamp,
            endDate: block.timestamp + 365 days, // 1 year coverage
            status: 0, // Active
            triggerConditions: triggerConditions,
            payWithLives: true,
            livesDiscount: discount
        });
        
        userPolicies[msg.sender].push(policyId);
        
        emit PolicyCreated(policyId, msg.sender, coverageAmount, premium);
        return policyId;
    }
    
    // Function to submit a claim
    function submitClaim(
        uint256 policyId,
        string memory evidence
    ) external returns (uint256) {
        Policy storage policy = policies[policyId];
        require(policy.user == msg.sender, "Not the policy owner");
        require(policy.status == 0, "Policy is not active");
        require(block.timestamp <= policy.endDate, "Policy has expired");
        require(bytes(evidence).length > 0, "Evidence required");
        
        uint256 claimId = nextClaimId++;
        
        claims[claimId] = Claim({
            id: claimId,
            user: msg.sender,
            policyId: policyId,
            evidence: evidence,
            amount: policy.coverageAmount,
            processed: false,
            approved: false,
            payout: 0
        });
        
        emit ClaimSubmitted(claimId, msg.sender, policyId, evidence);
        return claimId;
    }
    
    // Function to process a claim (only owner)
    function processClaim(
        uint256 claimId,
        bool approved,
        uint256 payout
    ) external onlyOwner {
        Claim storage claim = claims[claimId];
        require(!claim.processed, "Claim already processed");
        
        claim.processed = true;
        claim.approved = approved;
        claim.payout = payout;
        
        if (approved && payout > 0) {
            // Transfer payout to user
            IERC20(shieldToken).transfer(claim.user, payout);
        }
        
        emit ClaimProcessed(claimId, approved, payout);
    }
    
    // View functions
    function getUserPolicies(address user) external view returns (Policy[] memory) {
        uint256[] memory userPolicyIds = userPolicies[user];
        Policy[] memory userPoliciesArray = new Policy[](userPolicyIds.length);
        
        for (uint256 i = 0; i < userPolicyIds.length; i++) {
            userPoliciesArray[i] = policies[userPolicyIds[i]];
        }
        
        return userPoliciesArray;
    }
    
    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }
    
    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }
    
    function getPoolStats() external view returns (PoolStats memory) {
        uint256 totalLiquidity = IERC20(shieldToken).balanceOf(address(this));
        uint256 activePoliciesCount = 0;
        
        // Count active policies
        for (uint256 i = 1; i < nextPolicyId; i++) {
            if (policies[i].status == 0) {
                activePoliciesCount++;
            }
        }
        
        return PoolStats({
            totalLiquidity: totalLiquidity,
            activePolicies: activePoliciesCount,
            totalClaims: nextClaimId - 1,
            averageApy: 1250 // 12.5% in basis points
        });
    }
    
    // Admin functions
    function setLivesToken(address _livesToken) external onlyOwner {
        livesToken = _livesToken;
    }
    
    function setShieldToken(address _shieldToken) external onlyOwner {
        shieldToken = _shieldToken;
    }
    
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
}
