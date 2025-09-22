use anchor_lang::prelude::*;
use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SwitchboardOracleData {
    pub aggregator_key: Pubkey,
    pub latest_value: SwitchboardDecimal,
    pub latest_timestamp: i64,
    pub min_response_value: SwitchboardDecimal,
    pub max_response_value: SwitchboardDecimal,
    pub std_deviation: SwitchboardDecimal,
    pub num_success: u32,
    pub num_error: u32,
}

impl SwitchboardOracleData {
    pub fn from_aggregator_account(
        aggregator_key: Pubkey,
        aggregator_data: &AggregatorAccountData,
    ) -> Result<Self> {
        Ok(Self {
            aggregator_key,
            latest_value: aggregator_data.get_result()?,
            latest_timestamp: aggregator_data.latest_confirmed_round.round_open_timestamp,
            min_response_value: aggregator_data.latest_confirmed_round.min_response,
            max_response_value: aggregator_data.latest_confirmed_round.max_response,
            std_deviation: aggregator_data.latest_confirmed_round.std_deviation,
            num_success: aggregator_data.latest_confirmed_round.num_success,
            num_error: aggregator_data.latest_confirmed_round.num_error,
        })
    }

    pub fn get_value_f64(&self) -> Result<f64> {
        self.latest_value.try_into()
            .map_err(|_| ProgramError::InvalidAccountData.into())
    }

    pub fn is_data_fresh(&self, max_age_seconds: i64) -> bool {
        let current_time = Clock::get().unwrap().unix_timestamp;
        current_time - self.latest_timestamp <= max_age_seconds
    }

    pub fn get_confidence_score(&self) -> f64 {
        if self.num_success + self.num_error == 0 {
            return 0.0;
        }

        let success_rate = self.num_success as f64 / (self.num_success + self.num_error) as f64;

        // Factor in standard deviation - lower is better
        let std_dev_f64 = self.std_deviation.try_into().unwrap_or(0.0);
        let value_f64 = self.latest_value.try_into().unwrap_or(0.0);

        let cv = if value_f64 != 0.0 { std_dev_f64 / value_f64.abs() } else { 1.0 };
        let stability_score = (1.0 - cv.min(1.0)).max(0.0);

        (success_rate + stability_score) / 2.0
    }

    pub fn should_trigger_payout(&self, conditions: &crate::state::TriggerConditions) -> bool {
        let value = match self.get_value_f64() {
            Ok(v) => v,
            Err(_) => return false,
        };

        // Custom logic for bioscience-related triggers
        // This would be customized based on what the Switchboard feed represents

        // Example: if this is a clinical trial success rate feed
        let threshold = conditions.minimum_threshold as f64 / 100.0;

        // Trigger if value falls below threshold
        value < threshold
    }

    pub fn validate_data_quality(&self, min_responses: u32, max_variance: f64) -> Result<()> {
        // Check minimum number of successful responses
        require!(
            self.num_success >= min_responses,
            crate::errors::InsuranceError::InsufficientOracleResponses
        );

        // Check variance is within acceptable range
        let std_dev = self.std_deviation.try_into()
            .map_err(|_| crate::errors::InsuranceError::InvalidOracleData)?;
        let value = self.latest_value.try_into()
            .map_err(|_| crate::errors::InsuranceError::InvalidOracleData)?;

        if value != 0.0 {
            let coefficient_of_variation = std_dev / value.abs();
            require!(
                coefficient_of_variation <= max_variance,
                crate::errors::InsuranceError::HighOracleVariance
            );
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SwitchboardFeedConfig {
    pub aggregator_key: Pubkey,
    pub feed_name: String,
    pub feed_type: SwitchboardFeedType,
    pub update_interval: u32,
    pub min_sample_size: u32,
    pub max_variance_threshold: f64,
    pub heartbeat_interval: i64,
    pub is_active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum SwitchboardFeedType {
    ClinicalTrialSuccess,
    RegulatoryApproval,
    PatentValidation,
    ResearchFunding,
    MarketSentiment,
    BioPharmaIndex,
    Custom(String),
}

impl SwitchboardFeedConfig {
    pub fn new_clinical_trial_feed(
        aggregator_key: Pubkey,
        trial_name: String,
    ) -> Self {
        Self {
            aggregator_key,
            feed_name: format!("Clinical Trial: {}", trial_name),
            feed_type: SwitchboardFeedType::ClinicalTrialSuccess,
            update_interval: 3600, // 1 hour
            min_sample_size: 3,
            max_variance_threshold: 0.1, // 10%
            heartbeat_interval: 86400, // 24 hours
            is_active: true,
        }
    }

    pub fn new_regulatory_feed(
        aggregator_key: Pubkey,
        agency_name: String,
    ) -> Self {
        Self {
            aggregator_key,
            feed_name: format!("Regulatory: {}", agency_name),
            feed_type: SwitchboardFeedType::RegulatoryApproval,
            update_interval: 7200, // 2 hours
            min_sample_size: 2,
            max_variance_threshold: 0.05, // 5%
            heartbeat_interval: 172800, // 48 hours
            is_active: true,
        }
    }
}

// Helper functions for Switchboard integration
pub fn read_switchboard_aggregator(
    aggregator_account_info: &AccountInfo,
) -> Result<AggregatorAccountData> {
    let aggregator = AggregatorAccountData::new(aggregator_account_info)?;

    // Validate the aggregator is properly initialized
    require!(
        aggregator.latest_confirmed_round.num_success > 0,
        crate::errors::InsuranceError::UninitializedOracle
    );

    Ok(aggregator)
}

pub fn validate_switchboard_feed(
    aggregator_data: &AggregatorAccountData,
    max_staleness: i64,
    min_samples: u32,
) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;

    // Check data freshness
    let data_age = current_time - aggregator_data.latest_confirmed_round.round_open_timestamp;
    require!(
        data_age <= max_staleness,
        crate::errors::InsuranceError::StaleOracleData
    );

    // Check sample size
    require!(
        aggregator_data.latest_confirmed_round.num_success >= min_samples,
        crate::errors::InsuranceError::InsufficientOracleResponses
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_switchboard_feed_config() {
        let aggregator_key = Pubkey::new_unique();
        let config = SwitchboardFeedConfig::new_clinical_trial_feed(
            aggregator_key,
            "Phase III COVID Vaccine".to_string()
        );

        assert_eq!(config.aggregator_key, aggregator_key);
        assert_eq!(config.feed_type, SwitchboardFeedType::ClinicalTrialSuccess);
        assert!(config.is_active);
        assert_eq!(config.min_sample_size, 3);
    }

    #[test]
    fn test_confidence_score_calculation() {
        let oracle_data = SwitchboardOracleData {
            aggregator_key: Pubkey::new_unique(),
            latest_value: SwitchboardDecimal::from_f64(0.75),
            latest_timestamp: Clock::get().unwrap().unix_timestamp,
            min_response_value: SwitchboardDecimal::from_f64(0.70),
            max_response_value: SwitchboardDecimal::from_f64(0.80),
            std_deviation: SwitchboardDecimal::from_f64(0.05),
            num_success: 8,
            num_error: 2,
        };

        let confidence = oracle_data.get_confidence_score();
        assert!(confidence > 0.5); // Should be reasonably confident
        assert!(confidence <= 1.0);
    }
}