use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use std::str::FromStr;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PythOracleData {
    pub feed_id: [u8; 32],
    pub price: i64,
    pub conf: u64,
    pub expo: i32,
    pub publish_time: i64,
}

impl PythOracleData {
    pub fn new(
        feed_id_hex: &str,
        price: i64,
        conf: u64,
        expo: i32,
        publish_time: i64,
    ) -> Result<Self> {
        let feed_id = get_feed_id_from_hex(feed_id_hex)
            .map_err(|_| ProgramError::InvalidAccountData)?;

        Ok(Self {
            feed_id,
            price,
            conf,
            expo,
            publish_time,
        })
    }

    pub fn get_price_normalized(&self) -> Result<f64> {
        let price = self.price as f64;
        let expo = 10_f64.powi(self.expo);
        Ok(price * expo)
    }

    pub fn is_price_fresh(&self, max_age_seconds: i64) -> bool {
        let current_time = Clock::get().unwrap().unix_timestamp;
        current_time - self.publish_time <= max_age_seconds
    }

    pub fn verify_confidence(&self, max_confidence_pct: f64) -> bool {
        let price_abs = self.price.abs() as f64;
        let confidence_ratio = (self.conf as f64) / price_abs;
        confidence_ratio <= max_confidence_pct / 100.0
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BioScienceOracleData {
    pub trial_id: String,
    pub trial_status: TrialStatus,
    pub completion_percentage: u8,
    pub efficacy_score: Option<f64>,
    pub safety_score: Option<f64>,
    pub regulatory_status: RegulatoryStatus,
    pub last_updated: i64,
    pub data_source: DataSource,
    pub verification_hash: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TrialStatus {
    Planned,
    Recruiting,
    Active,
    Paused,
    Completed,
    Failed,
    Terminated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum RegulatoryStatus {
    PreApproval,
    UnderReview,
    Approved,
    Rejected,
    Withdrawn,
    PostMarket,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum DataSource {
    ClinicalTrialsGov,
    FDA,
    EMA,
    CustomAPI,
    ManualInput,
}

impl BioScienceOracleData {
    pub fn should_trigger_payout(&self, trigger_conditions: &super::TriggerConditions) -> bool {
        // Check clinical trial failure
        if trigger_conditions.clinical_trial_failure {
            match self.trial_status {
                TrialStatus::Failed | TrialStatus::Terminated => return true,
                _ => {}
            }
        }

        // Check regulatory rejection
        if trigger_conditions.regulatory_rejection {
            match self.regulatory_status {
                RegulatoryStatus::Rejected | RegulatoryStatus::Withdrawn => return true,
                _ => {}
            }
        }

        // Check efficacy threshold
        if let Some(efficacy) = self.efficacy_score {
            if efficacy < (trigger_conditions.minimum_threshold as f64 / 100.0) {
                return true;
            }
        }

        false
    }

    pub fn is_data_fresh(&self, max_age_seconds: i64) -> bool {
        let current_time = Clock::get().unwrap().unix_timestamp;
        current_time - self.last_updated <= max_age_seconds
    }
}

#[account]
pub struct OracleRegistry {
    pub authority: Pubkey,
    pub pyth_program: Pubkey,
    pub price_feeds: Vec<PriceFeed>,
    pub bioscience_feeds: Vec<BioScienceFeed>,
    pub emergency_pause: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PriceFeed {
    pub name: String,
    pub feed_id: [u8; 32],
    pub asset_type: AssetType,
    pub is_active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BioScienceFeed {
    pub name: String,
    pub feed_url: String,
    pub auth_token_hash: [u8; 32],
    pub update_frequency: u32, // seconds
    pub is_active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum AssetType {
    Cryptocurrency,
    Stock,
    Commodity,
    ForexPair,
    Custom,
}

// Oracle validation functions
pub fn validate_pyth_price_update(
    price_update: &PriceUpdateV2,
    expected_feed_id: &[u8; 32],
    max_age_seconds: i64,
    max_confidence_pct: f64,
) -> Result<PythOracleData> {
    // Verify feed ID
    require!(
        &price_update.price_message.feed_id == expected_feed_id,
        crate::errors::InsuranceError::InvalidOracleFeed
    );

    // Create oracle data
    let oracle_data = PythOracleData {
        feed_id: price_update.price_message.feed_id,
        price: price_update.price_message.price,
        conf: price_update.price_message.conf,
        expo: price_update.price_message.exponent,
        publish_time: price_update.price_message.publish_time,
    };

    // Verify freshness
    require!(
        oracle_data.is_price_fresh(max_age_seconds),
        crate::errors::InsuranceError::StaleOracleData
    );

    // Verify confidence
    require!(
        oracle_data.verify_confidence(max_confidence_pct),
        crate::errors::InsuranceError::LowOracleConfidence
    );

    Ok(oracle_data)
}

// Common feed IDs for bioscience-related assets
pub mod feed_ids {
    pub const SOL_USD: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
    pub const ETH_USD: &str = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
    pub const BTC_USD: &str = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

    // Custom feeds for bioscience metrics (would be registered separately)
    pub const BIOTECH_INDEX: &str = "custom_biotech_index_feed_id";
    pub const PHARMA_VOLATILITY: &str = "custom_pharma_volatility_feed_id";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_oracle_data_creation() {
        let oracle_data = PythOracleData::new(
            feed_ids::SOL_USD,
            100_000_000, // $100 with 8 decimal places
            50_000,      // $0.5 confidence
            -8,          // 8 decimal places
            1640995200,  // timestamp
        ).unwrap();

        assert_eq!(oracle_data.get_price_normalized().unwrap(), 100.0);
        assert!(oracle_data.verify_confidence(1.0)); // 0.5% confidence is < 1%
    }

    #[test]
    fn test_bioscience_trigger_conditions() {
        let oracle_data = BioScienceOracleData {
            trial_id: "NCT12345678".to_string(),
            trial_status: TrialStatus::Failed,
            completion_percentage: 75,
            efficacy_score: Some(0.3), // 30% efficacy
            safety_score: Some(0.9),
            regulatory_status: RegulatoryStatus::UnderReview,
            last_updated: Clock::get().unwrap().unix_timestamp,
            data_source: DataSource::ClinicalTrialsGov,
            verification_hash: [0; 32],
        };

        let trigger_conditions = crate::state::TriggerConditions {
            clinical_trial_failure: true,
            regulatory_rejection: false,
            ip_invalidation: false,
            minimum_threshold: 50, // 50% minimum efficacy
            custom_conditions: vec![],
        };

        assert!(oracle_data.should_trigger_payout(&trigger_conditions));
    }
}