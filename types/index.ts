export interface InsurancePolicy {
  id: string
  type: 'clinical_trial' | 'research_funding' | 'ip_protection' | 'regulatory_approval'
  coverageAmount: number
  premium: number
  startDate: Date
  endDate: Date
  status: 'active' | 'expired' | 'claimed' | 'cancelled'
  triggerConditions: TriggerConditions
  evidence?: string[]
  claimHistory?: Claim[]
  createdAt: Date
  updatedAt: Date
  // Optional properties for UI display
  name?: string
  healthScore?: number
  riskLevel?: 'low' | 'medium' | 'high' | 'very_high'
}

export interface TriggerConditions {
  clinicalTrialId?: string
  fundingMilestone?: string
  ipApplicationNumber?: string
  regulatorySubmissionId?: string
  thresholdValue?: number
  comparisonOperator?: 'greater_than' | 'less_than' | 'equals'
  dataSource: 'clinicaltrials.gov' | 'fda.gov' | 'uspto.gov' | 'custom_api'
}

export interface Claim {
  id: string
  policyId: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  evidence: string[]
  oracleData?: OracleData
  submittedAt: Date
  processedAt?: Date
  payoutTx?: string
}

export interface OracleData {
  source: string
  timestamp: Date
  value: any
  verified: boolean
  confidence: number
}

export interface LiquidityPool {
  id: string
  name: string
  totalLiquidity: number
  apy: number
  riskLevel: 'low' | 'medium' | 'high'
  activePolicies: number
  totalClaims: number
  stakedAmount?: number
  rewards?: number
}

export interface GovernanceProposal {
  id: string
  title: string
  description: string
  type: 'treasury' | 'protocol' | 'governance'
  status: 'active' | 'passed' | 'rejected' | 'executed'
  votesFor: number
  votesAgainst: number
  totalVotes: number
  startDate: Date
  endDate: Date
  proposer: string
  executionTx?: string
}

export interface UserPortfolio {
  totalPolicies: number
  activePolicies: number
  totalCoverage: number
  totalPremiums: number
  totalClaims: number
  totalPayouts: number
  healthScore: number
  riskExposure: number
  livesBalance: number
  shieldBalance: number
}

export interface NetworkStats {
  totalValueLocked: number
  activePolicies: number
  totalClaims: number
  totalPayouts: number
  averageApy: number
  protocolRevenue: number
  livesTokenPrice: number
  shieldTokenPrice: number
}

export interface BridgeTransaction {
  id: string
  fromChain: 'solana' | 'base' | 'ethereum'
  toChain: 'solana' | 'base' | 'ethereum'
  amount: number
  token: 'LIVES' | 'SHIELD' | 'USDC'
  status: 'pending' | 'completed' | 'failed'
  txHash: string
  bridgeTxHash?: string
  timestamp: Date
}

export interface WalletConnection {
  address: string
  chainId: number
  isConnected: boolean
  balance: number
  network: 'solana' | 'base' | 'ethereum'
}

export interface FormData {
  policyType: string
  coverageAmount: number
  duration: number
  triggerConditions: TriggerConditions
  payWithLives: boolean
  personalInfo: {
    name: string
    email: string
    organization: string
    researchField: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TransactionState {
  hash?: string
  status: 'idle' | 'pending' | 'success' | 'error'
  error?: string
}

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}
