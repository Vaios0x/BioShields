use anchor_lang::prelude::*;
use crate::state::InsurancePool;

#[derive(Accounts)]
pub struct UpdateOracle<'info> {
    #[account(
        mut,
        seeds = [b"insurance_pool", insurance_pool.authority.as_ref()],
        bump = insurance_pool.bump,
        constraint = insurance_pool.authority == authority.key()
    )]
    pub insurance_pool: Account<'info, InsurancePool>,
    
    pub authority: Signer<'info>,
}
