// Demo Configuration for BioShield Insurance
// This file contains mock data and configuration for the demo

export const DEMO_CONFIG = {
  // Network Configuration
  networks: {
    solana: {
      name: 'Solana Devnet',
      rpc: 'https://api.devnet.solana.com',
      programId: '3WhatnqPNSgXezguJtdugmz5N4LcxzDdbnxrSfpqYu6w',
      insurancePool: 'InsurP00L123456789012345678901234567890',
      livesToken: 'L1VES1234567890123456789012345678901234',
      shieldToken: 'SH1ELD123456789012345678901234567890123'
    },
    ethereum: {
      name: 'Base Sepolia',
      rpc: 'https://sepolia.base.org',
      contract: '0x1234567890123456789012345678901234567890',
      livesToken: '0x1234567890123456789012345678901234567890',
      shieldToken: '0x1234567890123456789012345678901234567890'
    },
    optimism: {
      name: 'Optimism Sepolia',
      rpc: 'https://sepolia.optimism.io',
      contract: '0x1234567890123456789012345678901234567890',
      livesToken: '0x1234567890123456789012345678901234567890',
      shieldToken: '0x1234567890123456789012345678901234567890'
    }
  },

  // Mock Data
  mockData: {
    policies: [
      {
        id: 'BS-DEMO-001',
        type: 'clinical_trial',
        coverageAmount: 500000,
        premium: 25000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-15'),
        status: 'active',
        triggerConditions: {
          clinicalTrialId: 'NCT12345678',
          dataSource: 'clinicaltrials.gov'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'BS-DEMO-002',
        type: 'research_funding',
        coverageAmount: 1000000,
        premium: 50000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-02-01'),
        status: 'active',
        triggerConditions: {
          fundingMilestone: 'ALZ-2024-001',
          dataSource: 'custom_api'
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      }
    ],
    
    poolStats: {
      totalLiquidity: 2400000,
      activePolicies: 156,
      totalClaims: 23,
      averageApy: 12.5
    },

    tokenBalances: {
      lives: 1000,
      shield: 500,
      usdc: 10000
    },

    tokenPrices: {
      lives: 0.85,
      shield: 0.42,
      usdc: 1.00
    }
  },

  // Demo Features
  features: {
    enableMockData: true,
    enableRealTransactions: false,
    enableOracleIntegration: false,
    enableCrossChain: false,
    enableAIRiskAssessment: true,
    enablePremiumCalculator: true
  },

  // UI Configuration
  ui: {
    showConnectionStatus: true,
    showTokenBalances: true,
    showNetworkSwitcher: true,
    showLivesDiscount: true,
    enableAnimations: true,
    enableSoundEffects: false
  },

  // Demo Scenarios
  scenarios: {
    clinicalTrialFailure: {
      id: 'NCT12345678',
      status: 'TERMINATED',
      reason: 'Lack of efficacy',
      payoutAmount: 500000,
      payoutDate: new Date('2024-06-15')
    },
    
    fundingMilestone: {
      id: 'ALZ-2024-001',
      status: 'ACHIEVED',
      amount: 1000000,
      date: new Date('2024-08-20')
    }
  }
}

export const getDemoConfig = () => DEMO_CONFIG

export const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
         process.env.NODE_ENV === 'development'
}

export const getMockData = () => {
  return isDemoMode() ? DEMO_CONFIG.mockData : null
}

export const getNetworkConfig = (network: 'solana' | 'ethereum' | 'optimism') => {
  return DEMO_CONFIG.networks[network]
}

export const getFeatureFlag = (feature: keyof typeof DEMO_CONFIG.features) => {
  return DEMO_CONFIG.features[feature]
}

export const getUIFlag = (flag: keyof typeof DEMO_CONFIG.ui) => {
  return DEMO_CONFIG.ui[flag]
}
