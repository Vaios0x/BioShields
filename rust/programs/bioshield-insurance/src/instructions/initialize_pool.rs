use anchor_lang::prelude::*;
use crate::state::{InsurancePool, PoolParams};

#[derive(Accounts)]
#[instruction(pool_params: PoolParams)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = InsurancePool::SIZE,
        seeds = [b"insurance_pool", authority.key().as_ref()],
        bump
    )]
    pub insurance_pool: Account<'info, InsurancePool>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub lives_token_mint: Account<'info, anchor_spl::token::Mint>,
    pub shield_token_mint: Account<'info, anchor_spl::token::Mint>,
    
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PoolParams {
    pub fee_basis_points: u16,
    pub min_coverage_amount: u64,
    pub max_coverage_amount: u64,
    pub oracle_address: Pubkey,
}
