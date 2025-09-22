'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useProvider, useSigner, useChainId } from 'wagmi'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useAppKit } from '@reown/appkit/react'
import toast from 'react-hot-toast'

export type NetworkType = 'ethereum' | 'solana'

export interface Web3Connection {
  isConnected: boolean
  currentNetwork: NetworkType
  address: string | null
  chainId?: number
  provider?: any
  signer?: any
  connection?: any
  wallet?: any
  error: string | null
  loading: boolean
}

export function useWeb3Connection() {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('ethereum')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Ethereum hooks
  const { address: ethAddress, isConnected: ethConnected, chain } = useAccount()
  const { data: provider } = useProvider()
  const { data: signer } = useSigner()
  const chainId = useChainId()
  
  // Solana hooks
  const { connection: solanaConnection } = useConnection()
  const { publicKey: solanaAddress, connected: solanaConnected, wallet: solanaWallet } = useWallet()
  
  // AppKit hook
  const { open: openAppKit } = useAppKit()

  // Detect current network
  useEffect(() => {
    const detectNetwork = () => {
      // Check if we're connected to Solana by looking at the AppKit state
      const appKitData = localStorage.getItem('@reown/appkit')
      if (appKitData) {
        try {
          const parsed = JSON.parse(appKitData)
          if (parsed?.solana?.address) {
            setCurrentNetwork('solana')
            return
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      // If we have an Ethereum connection, set to ethereum
      if (ethConnected) {
        setCurrentNetwork('ethereum')
      }
    }

    detectNetwork()
    
    // Listen for storage changes (when connections change)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '@reown/appkit') {
        detectNetwork()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically in case the storage event doesn't fire
    const interval = setInterval(detectNetwork, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [ethConnected])

  const connectWallet = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await openAppKit()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [openAppKit])

  const switchNetwork = useCallback(async (network: NetworkType) => {
    setLoading(true)
    setError(null)

    try {
      if (network === 'solana') {
        // Switch to Solana
        await openAppKit()
      } else {
        // Switch to Ethereum
        await openAppKit()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch network'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [openAppKit])

  const getConnectionInfo = useCallback((): Web3Connection => {
    const isConnected = ethConnected || solanaConnected
    const address = ethAddress || solanaAddress?.toString() || null

    return {
      isConnected,
      currentNetwork,
      address,
      chainId: currentNetwork === 'ethereum' ? chainId : undefined,
      provider: currentNetwork === 'ethereum' ? provider : undefined,
      signer: currentNetwork === 'ethereum' ? signer : undefined,
      connection: currentNetwork === 'solana' ? solanaConnection : undefined,
      wallet: currentNetwork === 'solana' ? solanaWallet : undefined,
      error,
      loading
    }
  }, [
    ethConnected,
    solanaConnected,
    currentNetwork,
    ethAddress,
    solanaAddress,
    chainId,
    provider,
    signer,
    solanaConnection,
    solanaWallet,
    error,
    loading
  ])

  const isNetworkSupported = useCallback((network: NetworkType) => {
    const supportedNetworks = ['ethereum', 'solana']
    return supportedNetworks.includes(network)
  }, [])

  const getNetworkDisplayName = useCallback((network: NetworkType) => {
    switch (network) {
      case 'ethereum':
        return chain?.name || 'Ethereum'
      case 'solana':
        return 'Solana'
      default:
        return 'Unknown'
    }
  }, [chain])

  const getAddressDisplay = useCallback((address: string | null) => {
    if (!address) return 'Not connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  return {
    // State
    currentNetwork,
    isConnected: ethConnected || solanaConnected,
    address: ethAddress || solanaAddress?.toString() || null,
    chainId: currentNetwork === 'ethereum' ? chainId : undefined,
    error,
    loading,

    // Ethereum specific
    ethAddress,
    ethConnected,
    provider,
    signer,

    // Solana specific
    solanaAddress,
    solanaConnected,
    solanaConnection,
    solanaWallet,

    // Actions
    connectWallet,
    switchNetwork,
    getConnectionInfo,
    isNetworkSupported,
    getNetworkDisplayName,
    getAddressDisplay,

    // Network detection
    isEthereum: currentNetwork === 'ethereum',
    isSolana: currentNetwork === 'solana'
  }
}
