use anchor_lang::prelude::*;
use crate::errors::InsuranceError;
use crate::state::{RiskCategory, BASIS_POINTS, LIVES_DISCOUNT_PERCENTAGE};

pub fn calculate_premium(
    coverage_amount: u64,
    coverage_period: u32,
    risk_category: RiskCategory,
) -> Result<u64> {
    // Base rate in basis points (1 bp = 0.01%)
    let base_rate = match risk_category {
        RiskCategory::Low => 300,      // 3%
        RiskCategory::Medium => 500,   // 5%
        RiskCategory::High => 800,     // 8%
        RiskCategory::VeryHigh => 1200, // 12%
    };

    // Calculate annual premium
    let annual_premium = coverage_amount
        .checked_mul(base_rate as u64)
        .ok_or(InsuranceError::PremiumCalculationOverflow)?
        .checked_div(BASIS_POINTS as u64)
        .ok_or(InsuranceError::PremiumCalculationOverflow)?;

    // Adjust for coverage period (in seconds to days)
    let period_in_days = coverage_period / (24 * 60 * 60);
    let premium = annual_premium
        .checked_mul(period_in_days as u64)
        .ok_or(InsuranceError::PremiumCalculationOverflow)?
        .checked_div(365)
        .ok_or(InsuranceError::PremiumCalculationOverflow)?;

    Ok(premium)
}

pub fn calculate_shield_tokens(
    liquidity_amount: u64,
    total_value_locked: u64,
    total_supply: u64,
) -> Result<u64> {
    if total_value_locked == 0 || total_supply == 0 {
        // First liquidity provider gets 1:1
        return Ok(liquidity_amount);
    }

    // Calculate proportional SHIELD tokens
    let shield_amount = liquidity_amount
        .checked_mul(total_supply)
        .unwrap()
        .checked_div(total_value_locked)
        .unwrap();

    Ok(shield_amount)
}

pub fn calculate_payout_amount(
    claim_amount: u64,
    coverage_amount: u64,
    total_claimed: u64,
    deductible: u64,
) -> Result<u64> {
    let remaining_coverage = coverage_amount
        .checked_sub(total_claimed)
        .ok_or(InsuranceError::PayoutCalculationError)?;

    let available_payout = std::cmp::min(claim_amount, remaining_coverage);
    
    if available_payout <= deductible {
        return Ok(0);
    }

    let payout = available_payout
        .checked_sub(deductible)
        .ok_or(InsuranceError::PayoutCalculationError)?;

    Ok(payout)
}

pub fn calculate_utilization_rate(
    total_coverage: u64,
    total_liquidity: u64,
) -> Result<u64> {
    if total_liquidity == 0 {
        return Ok(0);
    }

    let utilization = total_coverage
        .checked_mul(10000)
        .ok_or(InsuranceError::PremiumCalculationOverflow)?
        .checked_div(total_liquidity)
        .ok_or(InsuranceError::PremiumCalculationOverflow)?;

    Ok(utilization)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum RiskCategory {
    Low,
    Medium,
    High,
    VeryHigh,
}
