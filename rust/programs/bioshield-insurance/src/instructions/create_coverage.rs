use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::{InsurancePool, CoverageAccount, CoverageParams};

#[derive(Accounts)]
#[instruction(coverage_params: CoverageParams)]
pub struct CreateCoverage<'info> {
    #[account(
        init,
        payer = insured,
        space = CoverageAccount::SIZE,
        seeds = [b"coverage", insured.key().as_ref(), &coverage_params.coverage_amount.to_le_bytes()],
        bump
    )]
    pub coverage_account: Account<'info, CoverageAccount>,
    
    #[account(
        mut,
        seeds = [b"insurance_pool", insurance_pool.authority.as_ref()],
        bump = insurance_pool.bump
    )]
    pub insurance_pool: Account<'info, InsurancePool>,
    
    #[account(mut)]
    pub insured: Signer<'info>,
    
    /// CHECK: Optional LIVES token account for premium payment
    #[account(
        constraint = lives_token_account.is_some() == coverage_params.pay_with_lives
    )]
    pub lives_token_account: Option<Account<'info, TokenAccount>>,
    
    /// CHECK: Pool's LIVES token account
    #[account(
        mut,
        constraint = pool_lives_account.owner == insurance_pool.key()
    )]
    pub pool_lives_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CoverageParams {
    pub coverage_amount: u64,
    pub coverage_period: u32,
    pub coverage_type: crate::state::coverage_account::CoverageType,
    pub trigger_conditions: crate::state::oracle_data::TriggerConditions,
    pub risk_category: crate::utils::calculations::RiskCategory,
    pub metadata_uri: String,
    pub pay_with_lives: bool,
}
