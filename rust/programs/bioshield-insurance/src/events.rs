use anchor_lang::prelude::*;
use crate::state::coverage_account::CoverageType;

#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CoverageCreated {
    pub coverage: Pubkey,
    pub insured: Pubkey,
    pub amount: u64,
    pub premium: u64,
    pub coverage_type: CoverageType,
    pub timestamp: i64,
}

#[event]
pub struct ClaimSubmitted {
    pub claim: Pubkey,
    pub coverage: Pubkey,
    pub claimant: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimApproved {
    pub claim: Pubkey,
    pub payout_amount: u64,
    pub processor: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ClaimRejected {
    pub claim: Pubkey,
    pub reason: Option<String>,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityAdded {
    pub provider: Pubkey,
    pub amount: u64,
    pub shield_tokens_minted: u64,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityRemoved {
    pub provider: Pubkey,
    pub amount: u64,
    pub shield_tokens_burned: u64,
    pub timestamp: i64,
}

#[event]
pub struct PoolPaused {
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PoolUnpaused {
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OracleUpdated {
    pub pool: Pubkey,
    pub old_oracle: Pubkey,
    pub new_oracle: Pubkey,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PremiumPaid {
    pub coverage: Pubkey,
    pub insured: Pubkey,
    pub amount: u64,
    pub token: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PayoutProcessed {
    pub claim: Pubkey,
    pub claimant: Pubkey,
    pub amount: u64,
    pub token: Pubkey,
    pub timestamp: i64,
}
