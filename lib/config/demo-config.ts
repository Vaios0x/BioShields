// Demo Configuration for BioShield Insurance
// This file contains mock data and configuration for the demo

export const DEMO_CONFIG = {
  // Network Configuration
  networks: {
    solana: {
      name: 'Solana Devnet',
      rpc: 'https://api.devnet.solana.com',
      programId: '4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW',
      insurancePool: '4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW',
      livesToken: 'DoMbjPNnfThWx89KoX4XrsqPyKuoYSxHf91otU3KnzUz',
      shieldToken: '6ESbK51EppXAvQu5GtyWd9m7jqForjPm8F4fGQrLyKqP'
    },
    ethereum: {
      name: 'Base Sepolia',
      rpc: 'https://sepolia.base.org',
      contract: '0x5C0F9F645E82cFB26918369Feb1189211511250e',
      livesToken: '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279',
      shieldToken: '0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE'
    },
    optimism: {
      name: 'Optimism Sepolia',
      rpc: 'https://sepolia.optimism.io',
      contract: '0x0E98bc946F105e0371AD6D338d6814A4fcBBaC27',
      livesToken: '0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2',
      shieldToken: '0x15164c7C1E5ced9788c2fB82424fe595950ee261'
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
    enableMockData: false,
    enableRealTransactions: true,
    enableOracleIntegration: true,
    enableCrossChain: true,
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
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
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
