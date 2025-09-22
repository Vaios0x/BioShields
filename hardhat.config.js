require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    // Base Sepolia
    'base-sepolia': {
      url: process.env.NEXT_PUBLIC_BASE_RPC || 'https://sepolia.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    
    // Optimism Sepolia
    'optimism-sepolia': {
      url: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://sepolia.optimism.io',
      accounts: process.env.OPTIMISM_PRIVATE_KEY ? [process.env.OPTIMISM_PRIVATE_KEY] : [],
      chainId: 11155420,
    },
    
    // Local development
    hardhat: {
      chainId: 31337,
    },
    
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
  },
  
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  
  // Etherscan verification
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || '',
      optimismSepolia: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
      {
        network: 'optimismSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimism.etherscan.io/api',
          browserURL: 'https://sepolia-optimism.etherscan.io',
        },
      },
    ],
  },
  
  // Path configuration
  paths: {
    sources: './solidity/contracts',
    tests: './tests/contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
  
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
}
