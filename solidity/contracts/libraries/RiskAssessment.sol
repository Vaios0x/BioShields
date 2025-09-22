// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SafeMath.sol";

/**
 * @title RiskAssessment
 * @dev Library for assessing insurance risk profiles
 */
library RiskAssessment {
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

    enum CoverageType {
        ClinicalTrialFailure,
        RegulatoryRejection,
        IpInvalidation,
        ResearchInfrastructure,
        Custom
    }

    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant BASIS_POINTS = 10000;

    /**
     * @dev Assess risk for clinical trial failure coverage
     * @param coverageAmount The coverage amount
     * @param coveragePeriod The coverage period in seconds
     * @param trialPhase The clinical trial phase (1, 2, 3)
     * @param indication The therapeutic indication
     * @return The risk profile
     */
    function assessClinicalTrialRisk(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        uint8 trialPhase,
        string memory indication
    ) internal pure returns (RiskProfile memory) {
        uint256 score = 0;
        
        // Base score from trial phase
        if (trialPhase == 1) {
            score = score.add(80); // Very high risk
        } else if (trialPhase == 2) {
            score = score.add(60); // High risk
        } else if (trialPhase == 3) {
            score = score.add(40); // Medium risk
        } else {
            score = score.add(90); // Very high risk for unknown phase
        }
        
        // Adjust for indication
        score = _adjustForIndication(score, indication);
        
        // Adjust for coverage amount
        score = _adjustForCoverageAmount(score, coverageAmount);
        
        // Adjust for coverage period
        score = _adjustForCoveragePeriod(score, coveragePeriod);
        
        return _createRiskProfile(score);
    }

    /**
     * @dev Assess risk for regulatory rejection coverage
     * @param coverageAmount The coverage amount
     * @param coveragePeriod The coverage period in seconds
     * @param agency The regulatory agency (FDA, EMA, etc.)
     * @param indication The therapeutic indication
     * @return The risk profile
     */
    function assessRegulatoryRisk(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        string memory agency,
        string memory indication
    ) internal pure returns (RiskProfile memory) {
        uint256 score = 50; // Base medium risk
        
        // Adjust for agency
        if (keccak256(bytes(agency)) == keccak256("FDA")) {
            score = score.add(10); // FDA is more stringent
        } else if (keccak256(bytes(agency)) == keccak256("EMA")) {
            score = score.add(5); // EMA is moderately stringent
        }
        
        // Adjust for indication
        score = _adjustForIndication(score, indication);
        
        // Adjust for coverage amount
        score = _adjustForCoverageAmount(score, coverageAmount);
        
        // Adjust for coverage period
        score = _adjustForCoveragePeriod(score, coveragePeriod);
        
        return _createRiskProfile(score);
    }

    /**
     * @dev Assess risk for IP invalidation coverage
     * @param coverageAmount The coverage amount
     * @param coveragePeriod The coverage period in seconds
     * @param ipType The type of IP (patent, trademark, copyright)
     * @param jurisdiction The jurisdiction
     * @return The risk profile
     */
    function assessIpRisk(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        string memory ipType,
        string memory jurisdiction
    ) internal pure returns (RiskProfile memory) {
        uint256 score = 30; // Base low risk
        
        // Adjust for IP type
        if (keccak256(bytes(ipType)) == keccak256("patent")) {
            score = score.add(20); // Patents are more complex
        } else if (keccak256(bytes(ipType)) == keccak256("trademark")) {
            score = score.add(10); // Trademarks are moderate risk
        }
        
        // Adjust for jurisdiction
        if (keccak256(bytes(jurisdiction)) == keccak256("US")) {
            score = score.add(15); // US has complex IP laws
        } else if (keccak256(bytes(jurisdiction)) == keccak256("EU")) {
            score = score.add(10); // EU has moderate complexity
        }
        
        // Adjust for coverage amount
        score = _adjustForCoverageAmount(score, coverageAmount);
        
        // Adjust for coverage period
        score = _adjustForCoveragePeriod(score, coveragePeriod);
        
        return _createRiskProfile(score);
    }

    /**
     * @dev Assess risk for research infrastructure coverage
     * @param coverageAmount The coverage amount
     * @param coveragePeriod The coverage period in seconds
     * @param infrastructureType The type of infrastructure
     * @param location The location of infrastructure
     * @return The risk profile
     */
    function assessInfrastructureRisk(
        uint256 coverageAmount,
        uint256 coveragePeriod,
        string memory infrastructureType,
        string memory location
    ) internal pure returns (RiskProfile memory) {
        uint256 score = 40; // Base medium-low risk
        
        // Adjust for infrastructure type
        if (keccak256(bytes(infrastructureType)) == keccak256("laboratory")) {
            score = score.add(15); // Labs have higher risk
        } else if (keccak256(bytes(infrastructureType)) == keccak256("manufacturing")) {
            score = score.add(25); // Manufacturing has highest risk
        }
        
        // Adjust for location
        score = _adjustForLocation(score, location);
        
        // Adjust for coverage amount
        score = _adjustForCoverageAmount(score, coverageAmount);
        
        // Adjust for coverage period
        score = _adjustForCoveragePeriod(score, coveragePeriod);
        
        return _createRiskProfile(score);
    }

    /**
     * @dev Adjust risk score based on therapeutic indication
     * @param score The current risk score
     * @param indication The therapeutic indication
     * @return The adjusted risk score
     */
    function _adjustForIndication(uint256 score, string memory indication) 
        internal pure returns (uint256) {
        bytes32 indicationHash = keccak256(bytes(indication));
        
        // High-risk indications
        if (indicationHash == keccak256("oncology") || 
            indicationHash == keccak256("cancer")) {
            return score.add(20);
        }
        
        // Medium-risk indications
        if (indicationHash == keccak256("neurology") || 
            indicationHash == keccak256("cardiology")) {
            return score.add(10);
        }
        
        // Low-risk indications
        if (indicationHash == keccak256("dermatology") || 
            indicationHash == keccak256("ophthalmology")) {
            return score.sub(5);
        }
        
        return score;
    }

    /**
     * @dev Adjust risk score based on coverage amount
     * @param score The current risk score
     * @param coverageAmount The coverage amount
     * @return The adjusted risk score
     */
    function _adjustForCoverageAmount(uint256 score, uint256 coverageAmount) 
        internal pure returns (uint256) {
        if (coverageAmount > 10000000 * 10**18) { // > $10M
            return score.add(20);
        } else if (coverageAmount > 5000000 * 10**18) { // > $5M
            return score.add(10);
        } else if (coverageAmount < 100000 * 10**18) { // < $100K
            return score.sub(5);
        }
        
        return score;
    }

    /**
     * @dev Adjust risk score based on coverage period
     * @param score The current risk score
     * @param coveragePeriod The coverage period in seconds
     * @return The adjusted risk score
     */
    function _adjustForCoveragePeriod(uint256 score, uint256 coveragePeriod) 
        internal pure returns (uint256) {
        uint256 periodInDays = coveragePeriod.div(1 days);
        
        if (periodInDays > 730) { // > 2 years
            return score.add(15);
        } else if (periodInDays > 365) { // > 1 year
            return score.add(10);
        } else if (periodInDays < 90) { // < 3 months
            return score.sub(5);
        }
        
        return score;
    }

    /**
     * @dev Adjust risk score based on location
     * @param score The current risk score
     * @param location The location
     * @return The adjusted risk score
     */
    function _adjustForLocation(uint256 score, string memory location) 
        internal pure returns (uint256) {
        bytes32 locationHash = keccak256(bytes(location));
        
        // High-risk locations
        if (locationHash == keccak256("developing") || 
            locationHash == keccak256("emerging")) {
            return score.add(15);
        }
        
        // Low-risk locations
        if (locationHash == keccak256("developed") || 
            locationHash == keccak256("stable")) {
            return score.sub(5);
        }
        
        return score;
    }

    /**
     * @dev Create risk profile from score
     * @param score The risk score
     * @return The risk profile
     */
    function _createRiskProfile(uint256 score) 
        internal pure returns (RiskProfile memory) {
        // Ensure score is within bounds
        if (score > MAX_RISK_SCORE) {
            score = MAX_RISK_SCORE;
        }
        
        RiskCategory category;
        uint256 multiplier;
        
        if (score < 30) {
            category = RiskCategory.Low;
            multiplier = 300; // 3%
        } else if (score < 50) {
            category = RiskCategory.Medium;
            multiplier = 500; // 5%
        } else if (score < 80) {
            category = RiskCategory.High;
            multiplier = 800; // 8%
        } else {
            category = RiskCategory.VeryHigh;
            multiplier = 1200; // 12%
        }
        
        return RiskProfile({
            category: category,
            score: score,
            multiplier: multiplier,
            dataHash: keccak256(abi.encode(score, category, multiplier))
        });
    }

    /**
     * @dev Calculate composite risk score from multiple factors
     * @param factors Array of risk factors
     * @param weights Array of weights for each factor
     * @return The composite risk score
     */
    function calculateCompositeRisk(
        uint256[] memory factors,
        uint256[] memory weights
    ) internal pure returns (uint256) {
        require(factors.length == weights.length, "Arrays length mismatch");
        
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < factors.length; i++) {
            weightedSum = weightedSum.add(factors[i].mul(weights[i]));
            totalWeight = totalWeight.add(weights[i]);
        }
        
        if (totalWeight == 0) {
            return 0;
        }
        
        return weightedSum.div(totalWeight);
    }

    /**
     * @dev Validate risk assessment parameters
     * @param coverageAmount The coverage amount
     * @param coveragePeriod The coverage period
     * @return True if parameters are valid
     */
    function validateRiskParameters(
        uint256 coverageAmount,
        uint256 coveragePeriod
    ) internal pure returns (bool) {
        return coverageAmount > 0 && 
               coveragePeriod > 0 && 
               coveragePeriod <= 5 * 365 days; // Max 5 years
    }
}
