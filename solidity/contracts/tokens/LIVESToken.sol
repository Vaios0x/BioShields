// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title LIVESToken
 * @dev Utility token for BioShield Insurance ecosystem
 * Features:
 * - Premium payment discounts (50% off)
 * - Research funding rewards
 * - Cross-chain bridge compatible
 * - Deflationary mechanics through burning
 */
contract LIVESToken is
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PermitUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ========== CONSTANTS ==========
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    uint256 public constant MAX_SUPPLY = 500000000 * 10**18; // 500M tokens
    uint256 public constant INITIAL_SUPPLY = 50000000 * 10**18; // 50M tokens

    // ========== STATE VARIABLES ==========

    mapping(address => bool) public authorized;
    mapping(address => uint256) public researchContributions;
    mapping(address => uint256) public premiumDiscounts;

    uint256 public totalBurned;
    uint256 public burnRate; // Percentage of transactions to burn
    uint256 public researchFundingPool;

    address public bioShieldInsurance;
    address public researchDAO;
    address public bridge;

    // ========== EVENTS ==========

    event ResearchContribution(address indexed contributor, uint256 amount);
    event PremiumDiscountApplied(address indexed user, uint256 discount);
    event TokensBridged(address indexed user, uint256 amount, string targetChain);
    event BurnRateUpdated(uint256 oldRate, uint256 newRate);

    // ========== MODIFIERS ==========

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "Not authorized");
        _;
    }

    modifier onlyBioShield() {
        require(msg.sender == bioShieldInsurance, "Only BioShield contract");
        _;
    }

    // ========== INITIALIZATION ==========

    function initialize(
        string memory name,
        string memory symbol,
        address _bioShieldInsurance,
        address _researchDAO
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        __ERC20Permit_init(name);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        bioShieldInsurance = _bioShieldInsurance;
        researchDAO = _researchDAO;
        burnRate = 100; // 1% burn rate

        authorized[_bioShieldInsurance] = true;
        authorized[_researchDAO] = true;

        // Mint initial supply
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ========== MINTING & BURNING ==========

    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function burnForPremium(address from, uint256 amount)
        external
        onlyBioShield
        returns (bool)
    {
        require(balanceOf(from) >= amount, "Insufficient balance");
        _burn(from, amount);
        totalBurned += amount;

        // Apply discount
        uint256 discount = amount / 2; // 50% discount value
        premiumDiscounts[from] += discount;

        emit PremiumDiscountApplied(from, discount);
        return true;
    }

    function burnFromTransaction(uint256 amount) internal {
        if (amount > 0 && totalSupply() > amount) {
            uint256 burnAmount = (amount * burnRate) / 10000;
            if (burnAmount > 0) {
                _burn(address(this), burnAmount);
                totalBurned += burnAmount;
            }
        }
    }

    // ========== RESEARCH FUNDING ==========

    function contributeToResearch(uint256 amount)
        external
        whenNotPaused
    {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _transfer(msg.sender, researchDAO, amount);

        researchContributions[msg.sender] += amount;
        researchFundingPool += amount;

        // Reward contributor with additional tokens
        uint256 reward = amount / 10; // 10% bonus
        if (totalSupply() + reward <= MAX_SUPPLY) {
            _mint(msg.sender, reward);
        }

        emit ResearchContribution(msg.sender, amount);
    }

    function claimResearchReward(address researcher, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(researcher, amount);
    }

    // ========== BRIDGE FUNCTIONS ==========

    function bridgeToSolana(uint256 amount)
        external
        whenNotPaused
    {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _burn(msg.sender, amount);

        emit TokensBridged(msg.sender, amount, "solana");
    }

    function bridgeFromSolana(address to, uint256 amount)
        external
        onlyRole(BRIDGE_ROLE)
        whenNotPaused
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    // ========== VIEW FUNCTIONS ==========

    function getResearchContribution(address contributor)
        external
        view
        returns (uint256)
    {
        return researchContributions[contributor];
    }

    function getPremiumDiscount(address user)
        external
        view
        returns (uint256)
    {
        return premiumDiscounts[user];
    }

    function getTokenomics()
        external
        view
        returns (
            uint256 totalSupplyValue,
            uint256 maxSupplyValue,
            uint256 totalBurnedValue,
            uint256 burnRateValue,
            uint256 researchFunding
        )
    {
        return (
            totalSupply(),
            MAX_SUPPLY,
            totalBurned,
            burnRate,
            researchFundingPool
        );
    }

    // ========== ADMIN FUNCTIONS ==========

    function setBurnRate(uint256 newRate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newRate <= 1000, "Burn rate too high"); // Max 10%
        uint256 oldRate = burnRate;
        burnRate = newRate;
        emit BurnRateUpdated(oldRate, newRate);
    }

    function setAuthorized(address account, bool status)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        authorized[account] = status;
    }

    function setBioShieldInsurance(address newContract)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newContract != address(0), "Invalid address");
        bioShieldInsurance = newContract;
        authorized[newContract] = true;
    }

    function setBridge(address newBridge)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newBridge != address(0), "Invalid address");
        bridge = newBridge;
        _grantRole(BRIDGE_ROLE, newBridge);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }

    // ========== OVERRIDES ==========

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);

        // Apply burn rate on transfers (excluding mints/burns)
        if (from != address(0) && to != address(0)) {
            burnFromTransaction(amount);
        }
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    // ========== UTILITY FUNCTIONS ==========

    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused {
        require(recipients.length == amounts.length, "Arrays length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }

    function multiMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(recipients.length == amounts.length, "Arrays length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}