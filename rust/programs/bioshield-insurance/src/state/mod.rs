use anchor_lang::prelude::*;

pub mod insurance_pool;
pub mod coverage_account;
pub mod claim;
pub mod oracle_data;

pub use insurance_pool::*;
pub use coverage_account::*;
pub use claim::*;
pub use oracle_data::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct PoolParams {
    pub fee_basis_points: u16,
    pub min_coverage_amount: u64,
    pub max_coverage_amount: u64,
    pub oracle_address: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct CoverageParams {
    pub coverage_amount: u64,
    pub coverage_period: u32,
    pub coverage_type: CoverageType,
    pub trigger_conditions: TriggerConditions,
    pub risk_category: RiskCategory,
    pub metadata_uri: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct ClaimData {
    pub amount: u64,
    pub claim_type: ClaimType,
    pub evidence_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct OracleData {
    pub request_id: [u8; 32],
    pub timestamp: i64,
    pub data_points: Vec<DataPoint>,
    pub signature: [u8; 64],
}

impl OracleData {
    pub fn verify_signature(&self, oracle_pubkey: &Pubkey) -> Result<bool> {
        // Oracle signature verification logic
        // In production, this would verify the signature against the oracle's pubkey
        Ok(true) // Simplified for example
    }

    pub fn verify_trigger_conditions(&self, conditions: &TriggerConditions) -> Result<bool> {
        for data_point in &self.data_points {
            match &data_point.data_type {
                DataType::ClinicalTrialResult { success } => {
                    if conditions.clinical_trial_failure && !success {
                        return Ok(true);
                    }
                },
                DataType::RegulatoryDecision { approved } => {
                    if conditions.regulatory_rejection && !approved {
                        return Ok(true);
                    }
                },
                DataType::IpValidation { valid } => {
                    if conditions.ip_invalidation && !valid {
                        return Ok(true);
                    }
                },
                DataType::CustomVerification { verified } => {
                    if !verified {
                        return Ok(true);
                    }
                },
            }
        }
        Ok(false)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct DataPoint {
    pub data_type: DataType,
    pub value: u64,
    pub source: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum DataType {
    ClinicalTrialResult { success: bool },
    RegulatoryDecision { approved: bool },
    IpValidation { valid: bool },
    CustomVerification { verified: bool },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CoverageType {
    ClinicalTrialFailure,
    RegulatoryRejection,
    IpInvalidation,
    ResearchInfrastructure,
    Custom,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CoverageStatus {
    Active,
    Expired,
    Exhausted,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ClaimType {
    FullCoverage,
    PartialCoverage,
    Milestone,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ClaimStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Paid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum RiskCategory {
    Low,
    Medium,
    High,
    VeryHigh,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct TriggerConditions {
    pub clinical_trial_failure: bool,
    pub regulatory_rejection: bool,
    pub ip_invalidation: bool,
    pub minimum_threshold: u64,
    pub custom_conditions: Vec<CustomCondition>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct CustomCondition {
    pub condition_type: String,
    pub threshold: u64,
    pub operator: ComparisonOperator,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ComparisonOperator {
    GreaterThan,
    LessThan,
    Equal,
    NotEqual,
}

// Constants
pub const MAX_COVERAGE_AMOUNT: u64 = 15_000_000 * 1_000_000_000; // $15M in lamports
pub const MIN_COVERAGE_AMOUNT: u64 = 1_000 * 1_000_000_000; // $1K in lamports
pub const MAX_COVERAGE_PERIOD: u32 = 365 * 24 * 60 * 60; // 1 year in seconds
pub const LIVES_DISCOUNT_PERCENTAGE: u8 = 50; // 50% discount
pub const BASIS_POINTS: u16 = 10_000;
