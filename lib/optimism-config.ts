// Optimism Sepolia Configuration for BioShield Insurance
// Private key for Optimism Sepolia testnet

export const optimismSepoliaConfig = {
  // Private key for Optimism Sepolia testnet
  privateKey: 'cdf3a5b835fbba21d85927c43246285f2cefdcf4d665c3cdc7335f1da05d2450',
  
  // Network configuration
  chainId: 11155420,
  name: 'Optimism Sepolia',
  rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://sepolia.optimism.io',
  
  // Explorer
  explorerUrl: 'https://sepolia-optimism.etherscan.io',
  
  // Native currency
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  
  // Testnet configuration
  isTestnet: true,
  
  // Gas configuration
  gasConfig: {
    gasPrice: '1000000000', // 1 gwei
    gasLimit: '21000',
  },
}

// Export the private key for use in deployment scripts
export const OPTIMISM_SEPOLIA_PRIVATE_KEY = optimismSepoliaConfig.privateKey

// Export network info for wallet connection
export const optimismSepoliaNetwork = {
  chainId: optimismSepoliaConfig.chainId,
  name: optimismSepoliaConfig.name,
  rpcUrl: optimismSepoliaConfig.rpcUrl,
  explorerUrl: optimismSepoliaConfig.explorerUrl,
  nativeCurrency: optimismSepoliaConfig.nativeCurrency,
  isTestnet: optimismSepoliaConfig.isTestnet,
}
