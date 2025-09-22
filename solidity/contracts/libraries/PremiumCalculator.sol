// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SafeMath.sol";

/**
 * @title PremiumCalculator
 * @dev Library for calculating insurance premiums
 */
library PremiumCalculator {
    using SafeMath for uint256;

    struct RiskProfile {
        RiskCategory category;
        uint256 score;
        uint256 multiplier;
        bytes32 dataHash;
    }

    enum RiskCategory {
        Low,
        Medium,
        High,
        VeryHigh
    }

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    /**
     * @dev Calculate premium based on coverage amount, period, and risk profile
     * @param coverageAmount The amount of coverage requested
     * @param coveragePeriod The period of coverage in seconds
     * @param riskProfile The risk profile of the coverage
     * @return The calculated premium amount
     */
    function calculate(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        RiskProfile memory riskProfile
    ) internal pure returns (uint256) {
        // Base calculation
        uint256 annualPremium = coverageAmount
            .mul(riskProfile.multiplier)
            .div(BASIS_POINTS);
        
        // Adjust for period
        uint256 periodInDays = coveragePeriod.div(1 days);
        uint256 premium = annualPremium
            .mul(periodInDays)
            .div(365);
        
        // Apply risk score adjustment
        uint256 riskAdjustment = premium
            .mul(riskProfile.score)
            .div(1000);
        
        return premium.add(riskAdjustment);
    }

    /**
     * @dev Calculate premium with LIVES token discount
     * @param basePremium The base premium amount
     * @param discountPercentage The discount percentage (in basis points)
     * @return The discounted premium amount
     */
    function applyDiscount(
        uint256 basePremium,
        uint256 discountPercentage
    ) internal pure returns (uint256) {
        uint256 discountAmount = basePremium
            .mul(discountPercentage)
            .div(BASIS_POINTS);
        
        return basePremium.sub(discountAmount);
    }

    /**
     * @dev Calculate risk-adjusted premium
     * @param basePremium The base premium amount
     * @param riskMultiplier The risk multiplier (in basis points)
     * @return The risk-adjusted premium amount
     */
    function applyRiskMultiplier(
        uint256 basePremium,
        uint256 riskMultiplier
    ) internal pure returns (uint256) {
        return basePremium
            .mul(riskMultiplier)
            .div(BASIS_POINTS);
    }

    /**
     * @dev Calculate utilization-based premium adjustment
     * @param basePremium The base premium amount
     * @param utilizationRate The current utilization rate (in basis points)
     * @return The adjusted premium amount
     */
    function applyUtilizationAdjustment(
        uint256 basePremium,
        uint256 utilizationRate
    ) internal pure returns (uint256) {
        // Higher utilization = higher premium
        uint256 adjustmentFactor = BASIS_POINTS.add(
            utilizationRate.div(10) // 10% adjustment for every 1000 basis points of utilization
        );
        
        return basePremium
            .mul(adjustmentFactor)
            .div(BASIS_POINTS);
    }

    /**
     * @dev Calculate time-based premium adjustment
     * @param basePremium The base premium amount
     * @param coveragePeriod The coverage period in seconds
     * @return The time-adjusted premium amount
     */
    function applyTimeAdjustment(
        uint256 basePremium,
        uint256 coveragePeriod
    ) internal pure returns (uint256) {
        uint256 periodInYears = coveragePeriod
            .mul(BASIS_POINTS)
            .div(SECONDS_PER_YEAR);
        
        // Longer periods get slight discount
        uint256 timeDiscount = periodInYears
            .mul(50) // 0.5% discount per year
            .div(BASIS_POINTS);
        
        uint256 discountAmount = basePremium
            .mul(timeDiscount)
            .div(BASIS_POINTS);
        
        return basePremium.sub(discountAmount);
    }

    /**
     * @dev Calculate comprehensive premium with all adjustments
     * @param coverageAmount The coverage amount
     * @param coveragePeriod The coverage period in seconds
     * @param riskProfile The risk profile
     * @param utilizationRate The current utilization rate
     * @param livesDiscount Whether LIVES token discount applies
     * @return The final premium amount
     */
    function calculateComprehensivePremium(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        RiskProfile memory riskProfile,
        uint256 utilizationRate,
        bool livesDiscount
    ) internal pure returns (uint256) {
        // Start with base calculation
        uint256 premium = calculate(coverageAmount, coveragePeriod, riskProfile);
        
        // Apply utilization adjustment
        premium = applyUtilizationAdjustment(premium, utilizationRate);
        
        // Apply time adjustment
        premium = applyTimeAdjustment(premium, coveragePeriod);
        
        // Apply LIVES discount if applicable
        if (livesDiscount) {
            premium = applyDiscount(premium, 5000); // 50% discount
        }
        
        return premium;
    }

    /**
     * @dev Get base premium rate for risk category
     * @param category The risk category
     * @return The base premium rate in basis points
     */
    function getBaseRate(RiskCategory category) internal pure returns (uint256) {
        if (category == RiskCategory.Low) {
            return 300; // 3%
        } else if (category == RiskCategory.Medium) {
            return 500; // 5%
        } else if (category == RiskCategory.High) {
            return 800; // 8%
        } else if (category == RiskCategory.VeryHigh) {
            return 1200; // 12%
        }
        return 500; // Default to medium risk
    }

    /**
     * @dev Calculate minimum premium based on coverage amount
     * @param coverageAmount The coverage amount
     * @return The minimum premium amount
     */
    function getMinimumPremium(uint256 coverageAmount) internal pure returns (uint256) {
        // Minimum 0.1% of coverage amount
        return coverageAmount.div(1000);
    }

    /**
     * @dev Calculate maximum premium based on coverage amount
     * @param coverageAmount The coverage amount
     * @return The maximum premium amount
     */
    function getMaximumPremium(uint256 coverageAmount) internal pure returns (uint256) {
        // Maximum 20% of coverage amount
        return coverageAmount.mul(2000).div(BASIS_POINTS);
    }
}
