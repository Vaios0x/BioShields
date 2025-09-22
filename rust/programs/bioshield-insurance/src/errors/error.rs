use anchor_lang::prelude::*;

#[error_code]
pub enum InsuranceError {
    #[msg("Invalid coverage amount")]
    InvalidCoverageAmount,
    
    #[msg("Coverage is not active")]
    CoverageNotActive,
    
    #[msg("Coverage has expired")]
    CoverageExpired,
    
    #[msg("Invalid oracle signature")]
    InvalidOracleSignature,

    #[msg("Insufficient oracle consensus")]
    InsufficientOracleConsensus,

    #[msg("Stale oracle data")]
    StaleOracleData,

    #[msg("Low oracle confidence")]
    LowOracleConfidence,

    #[msg("Invalid oracle feed")]
    InvalidOracleFeed,

    #[msg("Insufficient oracle responses")]
    InsufficientOracleResponses,

    #[msg("High oracle variance")]
    HighOracleVariance,

    #[msg("Uninitialized oracle")]
    UninitializedOracle,
    
    #[msg("Unauthorized action")]
    Unauthorized,
    
    #[msg("Pool is paused")]
    PoolPaused,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Invalid risk category")]
    InvalidRiskCategory,
    
    #[msg("Claim already exists")]
    ClaimAlreadyExists,
    
    #[msg("Invalid trigger conditions")]
    InvalidTriggerConditions,
    
    #[msg("Premium calculation overflow")]
    PremiumCalculationOverflow,
    
    #[msg("Oracle data verification failed")]
    OracleVerificationFailed,
    
    #[msg("Claim amount exceeds coverage")]
    ClaimAmountExceedsCoverage,
    
    #[msg("Invalid claim status")]
    InvalidClaimStatus,
    
    #[msg("Pool not initialized")]
    PoolNotInitialized,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
    
    #[msg("Invalid liquidity amount")]
    InvalidLiquidityAmount,
    
    #[msg("Oracle not configured")]
    OracleNotConfigured,
    
    #[msg("Invalid oracle data")]
    InvalidOracleData,
    
    #[msg("Claim processing failed")]
    ClaimProcessingFailed,
    
    #[msg("Payout calculation error")]
    PayoutCalculationError,
}
