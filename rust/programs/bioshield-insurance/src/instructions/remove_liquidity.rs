use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, Burn};
use crate::state::InsurancePool;

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"insurance_pool", insurance_pool.authority.as_ref()],
        bump = insurance_pool.bump
    )]
    pub insurance_pool: Account<'info, InsurancePool>,
    
    #[account(mut)]
    pub liquidity_provider: Signer<'info>,
    
    #[account(
        mut,
        constraint = provider_shield_account.owner == liquidity_provider.key()
    )]
    pub provider_shield_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = pool_token_account.owner == insurance_pool.key()
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = liquidity_provider_token.owner == liquidity_provider.key()
    )]
    pub liquidity_provider_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = shield_token_mint.key() == insurance_pool.shield_token_mint
    )]
    pub shield_token_mint: Account<'info, Mint>,
    
    pub token_program: Program<'info, Token>,
}
