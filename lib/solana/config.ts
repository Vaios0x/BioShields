import { PublicKey } from '@solana/web3.js'

// Program ID desplegado en devnet
export const BIOSHIELD_PROGRAM_ID = new PublicKey('3WhatnqPNSgXezguJtdugmz5N4LcxzDdbnxrSfpqYu6w')

// Configuración de red
export const SOLANA_NETWORK = 'devnet'
export const SOLANA_RPC_ENDPOINT = 'https://api.devnet.solana.com'

// Configuración de cluster para Anchor
export const CLUSTER_CONFIG = {
  devnet: {
    url: 'https://api.devnet.solana.com',
    programId: BIOSHIELD_PROGRAM_ID,
  },
  mainnet: {
    url: 'https://api.mainnet-beta.solana.com',
    programId: BIOSHIELD_PROGRAM_ID, // Se actualizará para mainnet
  }
}

// PDAs (Program Derived Addresses) seeds
export const SEEDS = {
  INSURANCE_POOL: 'insurance_pool',
  COVERAGE_ACCOUNT: 'coverage_account',
  CLAIM_ACCOUNT: 'claim_account',
  USER_PROFILE: 'user_profile',
} as const

// Token addresses (se crearán después)
export const TOKEN_ADDRESSES = {
  LIVES_TOKEN: null as PublicKey | null,  // Token de utilidad
  SHIELD_TOKEN: null as PublicKey | null, // Token de gobernanza
} as const

// Pool configuration
export const POOL_CONFIG = {
  MIN_COVERAGE_AMOUNT: 1_000 * 1_000_000_000, // $1K en lamports
  MAX_COVERAGE_AMOUNT: 15_000_000 * 1_000_000_000, // $15M en lamports
  MAX_COVERAGE_PERIOD: 365 * 24 * 60 * 60, // 1 año en segundos
  LIVES_DISCOUNT_PERCENTAGE: 50, // 50% descuento con LIVES
  DEFAULT_FEE_BASIS_POINTS: 250, // 2.5%
} as const

// Oracle configuration
export const ORACLE_CONFIG = {
  PYTH_PROGRAM_ID: new PublicKey('FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH'),
  SWITCHBOARD_PROGRAM_ID: new PublicKey('SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'),
  UPDATE_INTERVAL: 60000, // 1 minuto
} as const

// Environment configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDebugLogs: process.env.NODE_ENV === 'development',
} as const