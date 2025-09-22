use anchor_lang::prelude::*;
use crate::state::{CoverageAccount, ClaimAccount, ClaimData};

#[derive(Accounts)]
#[instruction(claim_data: ClaimData)]
pub struct SubmitClaim<'info> {
    #[account(
        init,
        payer = claimant,
        space = ClaimAccount::SIZE,
        seeds = [b"claim", coverage_account.key().as_ref(), &claim_data.amount.to_le_bytes()],
        bump
    )]
    pub claim_account: Account<'info, ClaimAccount>,
    
    #[account(
        mut,
        constraint = coverage_account.insured == claimant.key()
    )]
    pub coverage_account: Account<'info, CoverageAccount>,
    
    #[account(mut)]
    pub claimant: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ClaimData {
    pub amount: u64,
    pub claim_type: crate::state::claim::ClaimType,
    pub evidence_hash: [u8; 32],
}
