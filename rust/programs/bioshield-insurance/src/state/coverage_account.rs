use anchor_lang::prelude::*;
use crate::state::oracle_data::TriggerConditions;

#[account]
pub struct CoverageAccount {
    pub insured: Pubkey,
    pub pool: Pubkey,
    pub coverage_amount: u64,
    pub premium_paid: u64,
    pub coverage_type: CoverageType,
    pub trigger_conditions: TriggerConditions,
    pub start_time: i64,
    pub end_time: i64,
    pub status: CoverageStatus,
    pub claims_made: u32,
    pub total_claimed: u64,
    pub metadata_uri: String,
    pub bump: u8,
}

impl CoverageAccount {
    pub const SIZE: usize = 8 + // discriminator
        32 + // insured
        32 + // pool
        8 + // coverage_amount
        8 + // premium_paid
        1 + 32 + // coverage_type (enum + data)
        TriggerConditions::SIZE + // trigger_conditions
        8 + // start_time
        8 + // end_time
        1 + // status
        4 + // claims_made
        8 + // total_claimed
        4 + 200 + // metadata_uri (string)
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CoverageType {
    ClinicalTrialFailure,
    RegulatoryRejection,
    IpInvalidation,
    ResearchInfrastructure,
    Custom { category: String },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CoverageStatus {
    Active,
    Expired,
    Exhausted,
    Cancelled,
}
