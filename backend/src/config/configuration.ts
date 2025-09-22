export const configuration = () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://bioshield:password@localhost:5432/bioshield',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'bioshield',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'bioshield',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'bioshield-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'bioshield-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Blockchain
  blockchain: {
    solana: {
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      programId: process.env.SOLANA_PROGRAM_ID || 'BioSh1eLdInsur4nc3Pr0gr4mIDxxxxxxxxxxxxxx',
      insurancePool: process.env.SOLANA_INSURANCE_POOL || 'InsurP00Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      livesToken: process.env.SOLANA_LIVES_TOKEN || 'L1VESxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      network: process.env.SOLANA_NETWORK || 'mainnet-beta',
    },
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-key',
      chainId: parseInt(process.env.ETHEREUM_CHAIN_ID, 10) || 1,
      bioshieldContract: process.env.ETHEREUM_BIOSHIELD_CONTRACT || '0x...',
      livesToken: process.env.ETHEREUM_LIVES_TOKEN || '0x...',
      shieldToken: process.env.ETHEREUM_SHIELD_TOKEN || '0x...',
    },
    base: {
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      chainId: parseInt(process.env.BASE_CHAIN_ID, 10) || 8453,
      bioshieldContract: process.env.BASE_BIOSHIELD_CONTRACT || '0x...',
      livesToken: process.env.BASE_LIVES_TOKEN || '0x...',
      shieldToken: process.env.BASE_SHIELD_TOKEN || '0x...',
    },
  },

  // Oracle
  oracle: {
    chainlink: {
      apiKey: process.env.CHAINLINK_API_KEY,
      oracleAddress: process.env.CHAINLINK_ORACLE_ADDRESS || '0x...',
      jobId: process.env.CHAINLINK_JOB_ID || 'job-id',
      fee: process.env.CHAINLINK_FEE || '1000000000000000000', // 1 LINK
    },
    clinicalTrials: {
      apiKey: process.env.CLINICAL_TRIALS_API_KEY,
      baseUrl: 'https://clinicaltrials.gov/api/v2/studies',
    },
    fda: {
      apiKey: process.env.FDA_API_KEY,
      baseUrl: 'https://api.fda.gov/drug',
    },
    uspto: {
      apiKey: process.env.USPTO_API_KEY,
      baseUrl: 'https://developer.uspto.gov/ibd-api',
    },
  },

  // IPFS
  ipfs: {
    pinata: {
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_KEY,
      gateway: 'https://gateway.pinata.cloud/ipfs/',
    },
    web3Storage: {
      token: process.env.WEB3_STORAGE_TOKEN,
    },
  },

  // Arweave
  arweave: {
    host: process.env.ARWEAVE_HOST || 'arweave.net',
    port: parseInt(process.env.ARWEAVE_PORT, 10) || 443,
    protocol: process.env.ARWEAVE_PROTOCOL || 'https',
    timeout: parseInt(process.env.ARWEAVE_TIMEOUT, 10) || 20000,
    logging: process.env.ARWEAVE_LOGGING === 'true',
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@bioshield.insurance',
  },

  // External APIs
  external: {
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3',
    },
    moralis: {
      apiKey: process.env.MORALIS_API_KEY,
      baseUrl: 'https://deep-index.moralis.io/api/v2',
    },
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // Monitoring
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      service: 'bioshield-api',
    },
  },
});
