import { PublicKey, Keypair } from '@solana/web3.js'
import BN from 'bn.js'

// Enums que coinciden con el programa Rust
export enum CoverageType {
  ClinicalTrialFailure = 'ClinicalTrialFailure',
  RegulatoryRejection = 'RegulatoryRejection',
  IpInvalidation = 'IpInvalidation',
  ResearchInfrastructure = 'ResearchInfrastructure',
  Custom = 'Custom',
}

export enum CoverageStatus {
  Active = 'Active',
  Expired = 'Expired',
  Exhausted = 'Exhausted',
  Cancelled = 'Cancelled',
}

export enum ClaimType {
  FullCoverage = 'FullCoverage',
  PartialCoverage = 'PartialCoverage',
  Milestone = 'Milestone',
}

export enum ClaimStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Paid = 'Paid',
}

export enum RiskCategory {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  VeryHigh = 'VeryHigh',
}

export enum ComparisonOperator {
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  Equal = 'Equal',
  NotEqual = 'NotEqual',
}

// Estructuras de datos
export interface InsurancePool {
  authority: PublicKey
  livesTokenMint: PublicKey
  shieldTokenMint: PublicKey
  totalValueLocked: BN
  totalCoverageAmount: BN
  totalClaimsPaid: BN
  poolFeeBasisPoints: number
  minCoverageAmount: BN
  maxCoverageAmount: BN
  oracleAddress: PublicKey
  createdAt: BN
  isPaused: boolean
  bump: number
}

export interface CoverageAccount {
  insured: PublicKey
  pool: PublicKey
  coverageAmount: BN
  premiumPaid: BN
  coverageType: CoverageType
  triggerConditions: TriggerConditions
  startTime: BN
  endTime: BN
  status: CoverageStatus
  claimsMade: number
  totalClaimed: BN
  metadataUri: string
  bump: number
}

export interface ClaimAccount {
  coverage: PublicKey
  claimant: PublicKey
  claimAmount: BN
  claimType: ClaimType
  evidenceHash: number[]
  oracleRequestId: number[] | null
  status: ClaimStatus
  submittedAt: BN
  processedAt: BN | null
  processor: PublicKey | null
  rejectionReason: string | null
  bump: number
}

export interface TriggerConditions {
  clinicalTrialFailure: boolean
  regulatoryRejection: boolean
  ipInvalidation: boolean
  minimumThreshold: BN
  customConditions: CustomCondition[]
}

export interface CustomCondition {
  conditionType: string
  threshold: BN
  operator: ComparisonOperator
}

export interface PoolParams {
  feeBasisPoints: number
  minCoverageAmount: BN
  maxCoverageAmount: BN
  oracleAddress: PublicKey
}

export interface CoverageParams {
  coverageAmount: BN
  coveragePeriod: number
  coverageType: CoverageType
  triggerConditions: TriggerConditions
  riskCategory: RiskCategory
  metadataUri: string
}

export interface ClaimData {
  amount: BN
  claimType: ClaimType
  evidenceHash: number[]
}

// Oracle data structures
export interface DataPoint {
  dataType: DataType
  value: BN
  source: string
}

export interface DataType {
  clinicalTrialResult?: { success: boolean }
  regulatoryDecision?: { approved: boolean }
  ipValidation?: { valid: boolean }
  customVerification?: { verified: boolean }
}

export interface MultiOracleData {
  requestId: number[]
  timestamp: BN
  dataPoints: DataPoint[]
  signatures: number[][]
  consensus: boolean
}

// Frontend specific types
export interface WalletContextType {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  disconnect: () => Promise<void>
  sendTransaction: (transaction: any) => Promise<string>
}

export interface ProgramContextType {
  program: any | null
  connection: any | null
  provider: any | null
  programId: PublicKey
  loading: boolean
  error: string | null
}

export interface PoolMetrics {
  totalValueLocked: number
  activePolicies: number
  totalClaims: number
  averageApy: number
  claimSuccessRate: number
  averageClaimTime: string
}

export interface UserProfile {
  publicKey: PublicKey
  coverages: CoverageAccount[]
  claims: ClaimAccount[]
  totalCoverage: BN
  activeCoverages: number
  totalClaimed: BN
}

// Transaction types
export interface TransactionResult {
  signature: string
  success: boolean
  error?: string
}

export interface PendingTransaction {
  signature: string
  type: 'initialize_pool' | 'create_coverage' | 'submit_claim' | 'add_liquidity'
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}