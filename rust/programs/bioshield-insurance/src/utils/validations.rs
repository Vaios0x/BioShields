use anchor_lang::prelude::*;
use crate::errors::InsuranceError;
use crate::state::oracle_data::TriggerConditions;

pub fn validate_coverage_amount(
    amount: u64,
    min_amount: u64,
    max_amount: u64,
) -> Result<()> {
    require!(
        amount >= min_amount && amount <= max_amount,
        InsuranceError::InvalidCoverageAmount
    );
    Ok(())
}

pub fn validate_coverage_period(period: u32) -> Result<()> {
    require!(
        period > 0 && period <= 365 * 5, // Max 5 years
        InsuranceError::InvalidCoverageAmount
    );
    Ok(())
}

pub fn validate_trigger_conditions(conditions: &TriggerConditions) -> Result<()> {
    // At least one trigger condition must be set
    require!(
        conditions.clinical_trial_failure ||
        conditions.regulatory_rejection ||
        conditions.ip_invalidation ||
        !conditions.custom_conditions.is_empty(),
        InsuranceError::InvalidTriggerConditions
    );

    // Validate custom conditions
    for condition in &conditions.custom_conditions {
        require!(
            !condition.condition_type.is_empty(),
            InsuranceError::InvalidTriggerConditions
        );
    }

    Ok(())
}

pub fn validate_claim_amount(
    claim_amount: u64,
    coverage_amount: u64,
    total_claimed: u64,
) -> Result<()> {
    let remaining_coverage = coverage_amount
        .checked_sub(total_claimed)
        .ok_or(InsuranceError::ClaimAmountExceedsCoverage)?;

    require!(
        claim_amount <= remaining_coverage,
        InsuranceError::ClaimAmountExceedsCoverage
    );

    require!(
        claim_amount > 0,
        InsuranceError::InvalidCoverageAmount
    );

    Ok(())
}

pub fn validate_liquidity_amount(amount: u64) -> Result<()> {
    require!(
        amount > 0,
        InsuranceError::InvalidLiquidityAmount
    );
    Ok(())
}

pub fn validate_oracle_data(data: &[u8]) -> Result<()> {
    require!(
        !data.is_empty(),
        InsuranceError::InvalidOracleData
    );
    Ok(())
}

pub fn validate_pool_parameters(
    min_coverage: u64,
    max_coverage: u64,
    fee_basis_points: u16,
) -> Result<()> {
    require!(
        min_coverage > 0 && max_coverage > min_coverage,
        InsuranceError::InvalidCoverageAmount
    );

    require!(
        fee_basis_points <= 1000, // Max 10%
        InsuranceError::InvalidCoverageAmount
    );

    Ok(())
}
