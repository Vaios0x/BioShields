// Reown AppKit Configuration for BioShield Insurance
// Multi-chain support: Base, Optimism Sepolia, Solana

import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from '@reown/appkit-adapter-wagmi'
import { SolanaProvider } from '@reown/appkit-adapter-solana'
import { base, optimismSepolia } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'
import { solana, solanaDevnet, solanaTestnet } from '@reown/appkit/networks'

// Project ID from Reown Cloud
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'your-project-id'

// Wagmi configuration for EVM chains
const wagmiConfig = createConfig({
  chains: [base, optimismSepolia],
  transports: {
    [base.id]: http(),
    [optimismSepolia.id]: http(),
  },
})

// Solana configuration
const solanaConfig = {
  networks: [solana, solanaDevnet, solanaTestnet],
  defaultNetwork: solana,
}

// AppKit configuration
export const appKitConfig = createAppKit({
  adapters: [
    WagmiProvider({
      config: wagmiConfig,
    }),
    SolanaProvider({
      config: solanaConfig,
    }),
  ],
  projectId,
  metadata: {
    name: 'BioShield Insurance',
    description: 'Decentralized Parametric Insurance for Biotech',
    url: 'https://bioshield.insurance',
    icons: ['https://bioshield.insurance/icon.png'],
  },
  features: {
    analytics: true,
    email: false,
    socials: ['twitter', 'discord', 'telegram'],
    emailShowWallets: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#7c3aed',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#7c3aed',
    '--w3m-border-radius-master': '12px',
  },
  defaultNetwork: base,
  enableNetworkSwitching: true,
  enableAccountView: true,
  enableExplorer: true,
  enableOnramp: true,
  enableWalletFeatures: true,
})

export { wagmiConfig, solanaConfig }
