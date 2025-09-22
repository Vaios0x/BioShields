use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OracleData {
    pub request_id: [u8; 32],
    pub timestamp: i64,
    pub data_points: Vec<DataPoint>,
    pub signature: [u8; 64],
}

impl OracleData {
    pub fn verify_signature(&self, oracle_address: &Pubkey) -> Result<bool> {
        // Implement signature verification logic
        // This would verify that the data was signed by the authorized oracle
        Ok(true) // Placeholder
    }

    pub fn verify_trigger_conditions(
        &self,
        conditions: &TriggerConditions
    ) -> Result<bool> {
        // Implement trigger condition verification logic
        // Check if the oracle data meets the trigger conditions
        for data_point in &self.data_points {
            match &data_point.data_type {
                DataType::ClinicalTrialResult { success } => {
                    if conditions.clinical_trial_failure && !success {
                        return Ok(true);
                    }
                }
                DataType::RegulatoryDecision { approved } => {
                    if conditions.regulatory_rejection && !approved {
                        return Ok(true);
                    }
                }
                DataType::IpStatus { valid } => {
                    if conditions.ip_invalidation && !valid {
                        return Ok(true);
                    }
                }
                _ => {}
            }
        }
        Ok(false)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DataPoint {
    pub data_type: DataType,
    pub value: u64,
    pub source: String,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum DataType {
    ClinicalTrialResult { success: bool },
    RegulatoryDecision { approved: bool },
    IpStatus { valid: bool },
    CustomMetric { name: String },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TriggerConditions {
    pub clinical_trial_failure: bool,
    pub regulatory_rejection: bool,
    pub ip_invalidation: bool,
    pub minimum_threshold: u64,
    pub custom_conditions: Vec<CustomCondition>,
}

impl TriggerConditions {
    pub const SIZE: usize = 1 + 1 + 1 + 8 + 4 + (32 * 5); // Max 5 custom conditions
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CustomCondition {
    pub condition_type: String,
    pub threshold_value: u64,
    pub comparison_operator: ComparisonOperator,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ComparisonOperator {
    GreaterThan,
    LessThan,
    Equal,
    GreaterThanOrEqual,
    LessThanOrEqual,
}
