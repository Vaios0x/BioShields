'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { baseSepolia, optimismSepolia, solanaTestnet } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import { clusterApiUrl } from '@solana/web3.js'
import { Adapter } from '@solana/wallet-adapter-base'
import React, { useMemo, useEffect, useState } from 'react'

// CSS will be imported in globals.css to avoid TypeScript issues

// Project ID from Reown Cloud
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '6c5ea103d2358fc8d91672222874f71b'

if (!projectId || projectId === 'your-project-id') {
  console.warn('Project ID is not properly configured. Using fallback.')
}

// Networks configuration - Testnets only for development
const networks = [baseSepolia, optimismSepolia] // Base Sepolia y Optimism Sepolia testnets
const solanaNetworks = [solanaTestnet] // Solana testnet only

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
  networks: [...networks, ...solanaNetworks] as any,
  metadata: {
    name: 'BioShield Insurance',
    description: 'Decentralized Parametric Insurance for Biotech',
    url: 'https://bioshield.insurance',
    icons: ['https://bioshield.insurance/icon.png'],
  },
  features: {
    analytics: false,
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

  // Solana wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ] as Adapter[],
    []
  )

  // Solana connection endpoint
  const endpoint = useMemo(() => clusterApiUrl('testnet'), [])

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider 
        config={wagmiAdapter.wagmiConfig} 
        initialState={initialState}
      >
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
