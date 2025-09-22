'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { baseSepolia, optimismSepolia, solanaTestnet } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi'
import React from 'react'

// Project ID from Reown Cloud
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'your-project-id'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Networks configuration - Testnets only for development
const networks = [baseSepolia, optimismSepolia] // Base Sepolia y Optimism Sepolia testnets
const solanaNetworks = [solanaTestnet] // Solana testnet only

// All networks for the modal (including Solana)
const allNetworks = [
  baseSepolia,    // Base testnet
  optimismSepolia, // Optimism testnet
  solanaTestnet   // Solana testnet
]

// Wagmi adapter configuration
const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  networks,
  projectId
})

// Solana adapter configuration
const solanaAdapter = new SolanaAdapter()

// Create AppKit modal with both Ethereum/Base and Solana support
const modal = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  projectId,
  networks: allNetworks as any,
  metadata: {
    name: 'BioShield Insurance',
    description: 'Decentralized Parametric Insurance for Biotech',
    url: 'https://bioshield.insurance',
    icons: ['https://bioshield.insurance/icon.png'],
  },
  features: {
    analytics: true,
    email: false,
    socials: ['discord'],
    emailShowWallets: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#7c3aed',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#7c3aed',
    '--w3m-border-radius-master': '12px',
  },
})

interface ProvidersProps {
  children: React.ReactNode
  cookies?: string | null
}

export function Providers({ children, cookies }: ProvidersProps) {
  const queryClient = new QueryClient()
  
  // Initialize state from cookies for SSR with proper error handling
  let initialState = undefined
  
  try {
    if (cookies && typeof cookies === 'string' && cookies.length > 0) {
      initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)
    }
  } catch (error) {
    console.warn('Failed to parse cookies for SSR:', error)
    initialState = undefined
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider 
        config={wagmiAdapter.wagmiConfig} 
        initialState={initialState}
      >
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}
