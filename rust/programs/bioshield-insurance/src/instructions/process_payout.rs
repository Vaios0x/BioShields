use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::{InsurancePool, CoverageAccount, ClaimAccount, OracleData};

#[derive(Accounts)]
pub struct ProcessClaimWithOracle<'info> {
    #[account(
        mut,
        constraint = claim_account.status == crate::state::claim::ClaimStatus::Pending
    )]
    pub claim_account: Account<'info, ClaimAccount>,
    
    #[account(
        mut,
        constraint = coverage_account.key() == claim_account.coverage
    )]
    pub coverage_account: Account<'info, CoverageAccount>,
    
    #[account(
        mut,
        seeds = [b"insurance_pool", insurance_pool.authority.as_ref()],
        bump = insurance_pool.bump
    )]
    pub insurance_pool: Account<'info, InsurancePool>,
    
    /// CHECK: Oracle processor account
    pub processor: Signer<'info>,
    
    /// CHECK: Pool's token account for payouts
    #[account(
        mut,
        constraint = pool_token_account.owner == insurance_pool.key()
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Claimant's token account
    #[account(
        mut,
        constraint = claimant_token_account.owner == claim_account.claimant
    )]
    pub claimant_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}
