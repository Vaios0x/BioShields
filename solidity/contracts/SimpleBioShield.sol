// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleBioShield {
    struct Policy {
        uint256 id;
        address policyholder;
        uint256 coverageAmount;
        uint256 premium;
        string triggerConditions;
        bool isActive;
        uint256 createdAt;
    }

    struct PoolStats {
        uint256 totalPolicies;
        uint256 totalCoverage;
        uint256 totalPremiums;
        uint256 activePolicies;
    }

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public userPolicies;
    uint256 public nextPolicyId = 1;
    address public owner;
    
    PoolStats public poolStats;

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed policyholder,
        uint256 coverageAmount,
        uint256 premium
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Initialize pool stats
        poolStats = PoolStats({
            totalPolicies: 0,
            totalCoverage: 0,
            totalPremiums: 0,
            activePolicies: 0
        });
    }

    // Create a new insurance policy (simple version)
    function createPolicy(
        uint256 _coverageAmount,
        uint256 _premium,
        string memory _triggerConditions
    ) external payable {
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_premium > 0, "Premium must be greater than 0");
        require(msg.value >= _premium, "Insufficient ETH for premium");
        require(bytes(_triggerConditions).length > 0, "Trigger conditions required");
        
        // Create policy
        uint256 policyId = nextPolicyId++;
        policies[policyId] = Policy({
            id: policyId,
            policyholder: msg.sender,
            coverageAmount: _coverageAmount,
            premium: _premium,
            triggerConditions: _triggerConditions,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Update user policies
        userPolicies[msg.sender].push(policyId);
        
        // Update pool stats
        poolStats.totalPolicies++;
        poolStats.totalCoverage += _coverageAmount;
        poolStats.totalPremiums += _premium;
        poolStats.activePolicies++;
        
        emit PolicyCreated(policyId, msg.sender, _coverageAmount, _premium);
    }

    // Create a new insurance policy with LIVES token discount (simplified)
    function createPolicyWithLives(
        uint256 _coverageAmount,
        uint256 _premium,
        string memory _triggerConditions,
        uint256 _livesAmount
    ) external payable {
        require(_coverageAmount > 0, "Coverage amount must be greater than 0");
        require(_premium > 0, "Premium must be greater than 0");
        require(_livesAmount > 0, "LIVES amount must be greater than 0");
        require(bytes(_triggerConditions).length > 0, "Trigger conditions required");
        
        // Calculate 50% discount
        uint256 discountAmount = (_premium * 50) / 100;
        uint256 discountedPremium = _premium - discountAmount;
        
        // Check if user has enough ETH for discounted premium
        require(msg.value >= discountedPremium, "Insufficient ETH for discounted premium");
        
        // Create policy with discounted premium
        uint256 policyId = nextPolicyId++;
        policies[policyId] = Policy({
            id: policyId,
            policyholder: msg.sender,
            coverageAmount: _coverageAmount,
            premium: discountedPremium,
            triggerConditions: _triggerConditions,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Update user policies
        userPolicies[msg.sender].push(policyId);
        
        // Update pool stats
        poolStats.totalPolicies++;
        poolStats.totalCoverage += _coverageAmount;
        poolStats.totalPremiums += discountedPremium;
        poolStats.activePolicies++;
        
        emit PolicyCreated(policyId, msg.sender, _coverageAmount, discountedPremium);
    }

    // Get user's policies
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    // Get policy details
    function getPolicy(uint256 _policyId) external view returns (Policy memory) {
        return policies[_policyId];
    }

    // Get pool statistics
    function getPoolStats() external view returns (PoolStats memory) {
        return poolStats;
    }

    // Get total number of policies
    function getPolicyCount() external view returns (uint256) {
        return poolStats.totalPolicies;
    }

    // Get all policies (for admin purposes)
    function getAllPolicies() external view returns (Policy[] memory) {
        Policy[] memory allPolicies = new Policy[](poolStats.totalPolicies);
        for (uint256 i = 1; i < nextPolicyId; i++) {
            allPolicies[i - 1] = policies[i];
        }
        return allPolicies;
    }

    // Withdraw contract balance (only owner)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
    }

    // Receive ETH
    receive() external payable {}
}