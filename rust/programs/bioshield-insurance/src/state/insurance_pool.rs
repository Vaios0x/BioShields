use anchor_lang::prelude::*;

#[account]
pub struct InsurancePool {
    pub authority: Pubkey,
    pub lives_token_mint: Pubkey,
    pub shield_token_mint: Pubkey,
    pub total_value_locked: u64,
    pub total_coverage_amount: u64,
    pub total_claims_paid: u64,
    pub pool_fee_basis_points: u16,
    pub min_coverage_amount: u64,
    pub max_coverage_amount: u64,
    pub oracle_address: Pubkey,
    pub created_at: i64,
    pub is_paused: bool,
    pub bump: u8,
}

impl InsurancePool {
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        32 + // lives_token_mint
        32 + // shield_token_mint
        8 + // total_value_locked
        8 + // total_coverage_amount
        8 + // total_claims_paid
        2 + // pool_fee_basis_points
        8 + // min_coverage_amount
        8 + // max_coverage_amount
        32 + // oracle_address
        8 + // created_at
        1 + // is_paused
        1; // bump
}
