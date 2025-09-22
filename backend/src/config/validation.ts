import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),

  // Database
  DATABASE_URL: Joi.string().required(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Solana
  SOLANA_RPC_URL: Joi.string().required(),
  SOLANA_PROGRAM_ID: Joi.string().required(),
  SOLANA_INSURANCE_POOL: Joi.string().required(),
  SOLANA_LIVES_TOKEN: Joi.string().required(),
  SOLANA_NETWORK: Joi.string().valid('mainnet-beta', 'testnet', 'devnet').default('mainnet-beta'),

  // Ethereum
  ETHEREUM_RPC_URL: Joi.string().required(),
  ETHEREUM_CHAIN_ID: Joi.number().default(1),
  ETHEREUM_BIOSHIELD_CONTRACT: Joi.string().required(),
  ETHEREUM_LIVES_TOKEN: Joi.string().required(),
  ETHEREUM_SHIELD_TOKEN: Joi.string().required(),

  // Base
  BASE_RPC_URL: Joi.string().required(),
  BASE_CHAIN_ID: Joi.number().default(8453),
  BASE_BIOSHIELD_CONTRACT: Joi.string().required(),
  BASE_LIVES_TOKEN: Joi.string().required(),
  BASE_SHIELD_TOKEN: Joi.string().required(),

  // Chainlink
  CHAINLINK_API_KEY: Joi.string().optional(),
  CHAINLINK_ORACLE_ADDRESS: Joi.string().required(),
  CHAINLINK_JOB_ID: Joi.string().required(),
  CHAINLINK_FEE: Joi.string().default('1000000000000000000'),

  // External APIs
  CLINICAL_TRIALS_API_KEY: Joi.string().optional(),
  FDA_API_KEY: Joi.string().optional(),
  USPTO_API_KEY: Joi.string().optional(),

  // IPFS
  PINATA_API_KEY: Joi.string().optional(),
  PINATA_SECRET_KEY: Joi.string().optional(),
  WEB3_STORAGE_TOKEN: Joi.string().optional(),

  // Email
  EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().default('noreply@bioshield.insurance'),

  // External services
  COINGECKO_API_KEY: Joi.string().optional(),
  MORALIS_API_KEY: Joi.string().optional(),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  RATE_LIMIT_WINDOW: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),

  // Frontend
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  ALLOWED_ORIGINS: Joi.string().optional(),

  // Monitoring
  SENTRY_DSN: Joi.string().optional(),
  DATADOG_API_KEY: Joi.string().optional(),
});
