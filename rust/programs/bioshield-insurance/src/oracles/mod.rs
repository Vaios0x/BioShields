pub mod pyth_oracle;
pub mod switchboard_oracle;
pub mod bioscience_oracle;

pub use pyth_oracle::*;
pub use switchboard_oracle::*;
pub use bioscience_oracle::*;

use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct MultiOracleData {
    pub price_data: Option<PythOracleData>,
    pub bioscience_data: Option<BioScienceOracleData>,
    pub switchboard_data: Option<SwitchboardOracleData>,
    pub consensus_timestamp: i64,
    pub data_sources_count: u8,
}

impl MultiOracleData {
    pub fn new() -> Self {
        Self {
            price_data: None,
            bioscience_data: None,
            switchboard_data: None,
            consensus_timestamp: Clock::get().unwrap().unix_timestamp,
            data_sources_count: 0,
        }
    }

    pub fn add_price_data(&mut self, data: PythOracleData) {
        self.price_data = Some(data);
        self.data_sources_count += 1;
    }

    pub fn add_bioscience_data(&mut self, data: BioScienceOracleData) {
        self.bioscience_data = Some(data);
        self.data_sources_count += 1;
    }

    pub fn add_switchboard_data(&mut self, data: SwitchboardOracleData) {
        self.switchboard_data = Some(data);
        self.data_sources_count += 1;
    }

    pub fn has_consensus(&self, min_sources: u8) -> bool {
        self.data_sources_count >= min_sources
    }

    pub fn should_trigger_claim_payout(&self, conditions: &crate::state::TriggerConditions) -> bool {
        // Check bioscience triggers
        if let Some(ref bio_data) = self.bioscience_data {
            if bio_data.should_trigger_payout(conditions) {
                return true;
            }
        }

        // Check switchboard triggers
        if let Some(ref sb_data) = self.switchboard_data {
            if sb_data.should_trigger_payout(conditions) {
                return true;
            }
        }

        false
    }

    pub fn get_risk_multiplier(&self) -> f64 {
        let mut multiplier = 1.0;

        // Factor in market volatility from price data
        if let Some(ref price_data) = self.price_data {
            let confidence_ratio = (price_data.conf as f64) / (price_data.price.abs() as f64);
            multiplier += confidence_ratio * 0.1; // Up to 10% increase based on volatility
        }

        // Factor in trial risk from bioscience data
        if let Some(ref bio_data) = self.bioscience_data {
            match bio_data.trial_status {
                crate::oracles::TrialStatus::Active => multiplier += 0.05,
                crate::oracles::TrialStatus::Paused => multiplier += 0.15,
                crate::oracles::TrialStatus::Failed => multiplier += 0.5,
                _ => {}
            }
        }

        multiplier.min(2.0) // Cap at 2x
    }
}

// Oracle aggregation traits
pub trait OracleProvider {
    fn get_latest_data(&self) -> Result<Box<dyn OracleData>>;
    fn is_healthy(&self) -> bool;
    fn get_confidence_score(&self) -> f64;
}

pub trait OracleData {
    fn get_timestamp(&self) -> i64;
    fn is_fresh(&self, max_age: i64) -> bool;
    fn get_data_hash(&self) -> [u8; 32];
}

// Implementation for Pyth
impl OracleData for PythOracleData {
    fn get_timestamp(&self) -> i64 {
        self.publish_time
    }

    fn is_fresh(&self, max_age: i64) -> bool {
        self.is_price_fresh(max_age)
    }

    fn get_data_hash(&self) -> [u8; 32] {
        use anchor_lang::solana_program::hash::hash;
        let data = format!("{}:{}:{}:{}",
            self.price, self.conf, self.expo, self.publish_time);
        hash(data.as_bytes()).to_bytes()
    }
}

// Implementation for BioScience
impl OracleData for BioScienceOracleData {
    fn get_timestamp(&self) -> i64 {
        self.last_updated
    }

    fn is_fresh(&self, max_age: i64) -> bool {
        self.is_data_fresh(max_age)
    }

    fn get_data_hash(&self) -> [u8; 32] {
        self.verification_hash
    }
}