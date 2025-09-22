// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SHIELDToken
 * @dev Governance and utility token for BioShield Insurance
 * Features:
 * - Governance voting with delegation
 * - Permit functionality for gasless transactions
 * - Yield farming rewards
 * - Insurance pool LP token
 * - Burn mechanism for deflation
 */
contract SHIELDToken is
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ========== CONSTANTS ==========
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1B tokens
    uint256 public constant INITIAL_SUPPLY = 100000000 * 10**18; // 100M tokens

    // ========== STATE VARIABLES ==========

    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public yieldRewards;
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;

    uint256 public totalStaked;
    uint256 public yieldRate; // Basis points per day
    uint256 public minStakingPeriod;

    address public insurancePool;
    address public yieldVault;

    // ========== EVENTS ==========

    event YieldClaimed(address indexed user, uint256 amount);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event Blacklisted(address indexed account, bool status);

    // ========== MODIFIERS ==========

    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }

    modifier onlyInsurancePool() {
        require(msg.sender == insurancePool, "Only insurance pool");
        _;
    }

    // ========== INITIALIZATION ==========

    function initialize(
        string memory name,
        string memory symbol,
        address _insurancePool,
        address _yieldVault
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __ERC20Permit_init(name);
        __ERC20Votes_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        insurancePool = _insurancePool;
        yieldVault = _yieldVault;
        yieldRate = 100; // 1% per day
        minStakingPeriod = 7 days;

        // Mint initial supply
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ========== MINTING FUNCTIONS ==========

    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        notBlacklisted(to)
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function mintToInsurancePool(uint256 amount)
        external
        onlyInsurancePool
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(insurancePool, amount);
    }

    // ========== STAKING FUNCTIONS ==========

    function stake(uint256 amount) external whenNotPaused notBlacklisted(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Update rewards before changing stake
        _updateYieldRewards(msg.sender);

        // Transfer tokens to this contract
        _transfer(msg.sender, address(this), amount);

        stakingBalance[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        totalStaked += amount;

        emit TokensStaked(msg.sender, amount);
    }

    function unstake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(stakingBalance[msg.sender] >= amount, "Insufficient staked balance");
        require(
            block.timestamp >= stakingTimestamp[msg.sender] + minStakingPeriod,
            "Minimum staking period not met"
        );

        // Update rewards before changing stake
        _updateYieldRewards(msg.sender);

        stakingBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);

        emit TokensUnstaked(msg.sender, amount);
    }

    function claimYield() external whenNotPaused notBlacklisted(msg.sender) {
        _updateYieldRewards(msg.sender);

        uint256 reward = yieldRewards[msg.sender];
        require(reward > 0, "No yield to claim");

        yieldRewards[msg.sender] = 0;

        // Mint yield rewards
        require(totalSupply() + reward <= MAX_SUPPLY, "Exceeds max supply");
        _mint(msg.sender, reward);

        emit YieldClaimed(msg.sender, reward);
    }

    function _updateYieldRewards(address account) internal {
        if (stakingBalance[account] > 0) {
            uint256 stakingTime = block.timestamp - stakingTimestamp[account];
            uint256 stakingDays = stakingTime / 1 days;

            if (stakingDays > 0) {
                uint256 reward = (stakingBalance[account] * yieldRate * stakingDays) / 10000;
                yieldRewards[account] += reward;
                stakingTimestamp[account] = block.timestamp;
            }
        }
    }

    // ========== VIEW FUNCTIONS ==========

    function pendingYield(address account) external view returns (uint256) {
        if (stakingBalance[account] == 0) return yieldRewards[account];

        uint256 stakingTime = block.timestamp - stakingTimestamp[account];
        uint256 stakingDays = stakingTime / 1 days;
        uint256 pendingReward = (stakingBalance[account] * yieldRate * stakingDays) / 10000;

        return yieldRewards[account] + pendingReward;
    }

    function getStakingInfo(address account)
        external
        view
        returns (
            uint256 stakedBalance,
            uint256 stakingStart,
            uint256 pendingRewards,
            uint256 claimableRewards
        )
    {
        stakedBalance = stakingBalance[account];
        stakingStart = stakingTimestamp[account];
        pendingRewards = this.pendingYield(account);

        bool canClaim = block.timestamp >= stakingTimestamp[account] + minStakingPeriod;
        claimableRewards = canClaim ? pendingRewards : 0;
    }

    // ========== ADMIN FUNCTIONS ==========

    function setYieldRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate <= 1000, "Rate too high"); // Max 10% per day
        yieldRate = newRate;
    }

    function setMinStakingPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minStakingPeriod = newPeriod;
    }

    function setInsurancePool(address newPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPool != address(0), "Invalid address");
        insurancePool = newPool;
    }

    function setBlacklisted(address account, bool status)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        blacklisted[account] = status;
        emit Blacklisted(account, status);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ========== OVERRIDES ==========

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable) whenNotPaused {
        require(!blacklisted[from] && !blacklisted[to], "Blacklisted address");
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._burn(account, amount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    // ========== GOVERNANCE FUNCTIONS ==========

    function delegate(address delegatee) public override whenNotPaused {
        super.delegate(delegatee);
    }

    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public override whenNotPaused {
        super.delegateBySig(delegatee, nonce, expiry, v, r, s);
    }
}