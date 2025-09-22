use anchor_lang::prelude::*;

#[account]
pub struct ClaimAccount {
    pub coverage: Pubkey,
    pub claimant: Pubkey,
    pub claim_amount: u64,
    pub claim_type: ClaimType,
    pub evidence_hash: [u8; 32],
    pub oracle_request_id: Option<[u8; 32]>,
    pub status: ClaimStatus,
    pub submitted_at: i64,
    pub processed_at: Option<i64>,
    pub processor: Option<Pubkey>,
    pub rejection_reason: Option<String>,
    pub bump: u8,
}

impl ClaimAccount {
    pub const SIZE: usize = 8 + // discriminator
        32 + // coverage
        32 + // claimant
        8 + // claim_amount
        1 + 32 + // claim_type
        32 + // evidence_hash
        1 + 32 + // oracle_request_id (Option)
        1 + // status
        8 + // submitted_at
        1 + 8 + // processed_at (Option)
        1 + 32 + // processor (Option)
        1 + 4 + 200 + // rejection_reason (Option<String>)
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ClaimType {
    FullCoverage,
    PartialCoverage { percentage: u8 },
    Milestone { milestone_id: u32 },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ClaimStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Paid,
}
