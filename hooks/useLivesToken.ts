'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useBalance, useWriteContract, useReadContract } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

const LIVES_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LIVES_TOKEN || '0x...'

export function useLivesToken() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<'solana' | 'ethereum'>('ethereum')
  
  const { address: ethAddress, isConnected: ethConnected } = useAccount()
  const { publicKey: solAddress, connected: solConnected } = useWallet()
  const { connection } = useConnection()
  
  // Wagmi hooks for contract interactions
  const { writeContractAsync: writeContract } = useWriteContract()
  const { data: livesBalance } = useReadContract({
    address: LIVES_TOKEN_ADDRESS as `0x${string}`,
    abi: [
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'balanceOf',
    args: ethAddress ? [ethAddress] : undefined,
    query: { enabled: !!ethAddress }
  })

  // Ethereum/Base balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: ethAddress,
    token: LIVES_TOKEN_ADDRESS as `0x${string}`,
  })

  // Detect current network
  useEffect(() => {
    if (solConnected && solAddress) {
      setCurrentNetwork('solana')
    } else if (ethConnected && ethAddress) {
      setCurrentNetwork('ethereum')
    }
  }, [solConnected, solAddress, ethConnected, ethAddress])

  // Fetch Solana balance
  const fetchSolBalance = useCallback(async () => {
    if (!solAddress || !connection) return

    setLoading(true)
    setError(null)

    try {
      // Mock implementation - en producción sería una llamada real al token SPL
      const mockBalance = Math.random() * 10000 // Random balance for demo
      setBalance(mockBalance)
    } catch (error) {
      console.error('Error fetching SOL balance:', error)
      setError('Failed to fetch balance')
    } finally {
      setLoading(false)
    }
  }, [solAddress, connection])

  // Fetch Ethereum balance using wagmi hooks
  const fetchEthBalance = useCallback(async () => {
    if (!ethAddress) return

    setLoading(true)
    setError(null)

    try {
      if (livesBalance) {
        setBalance(Number(livesBalance) / 1e18) // Convert from wei
      } else if (ethBalance) {
        setBalance(parseFloat(ethBalance.formatted))
      } else {
        // Fallback to mock balance
        setBalance(1000)
      }
    } catch (error) {
      console.error('Error fetching ETH balance:', error)
      setError('Failed to fetch balance')
      setBalance(1000)
    } finally {
      setLoading(false)
    }
  }, [ethAddress, livesBalance, ethBalance])

  const calculateDiscount = (amount: number) => {
    return amount * 0.5 // 50% discount with LIVES
  }

  const formatBalance = () => {
    return formatNumber(balance)
  }

  const hasEnoughBalance = (requiredAmount: number) => {
    return balance >= requiredAmount
  }

  const getDiscountAmount = (originalAmount: number) => {
    return originalAmount - calculateDiscount(originalAmount)
  }

  const getDiscountPercentage = () => {
    return 50 // 50% discount
  }

  const approve = useCallback(async (spender: string, amount: number) => {
    if (!ethConnected) {
      toast.error('Please connect your Ethereum wallet')
      return { success: false, error: 'Wallet not connected' }
    }

    setLoading(true)
    setError(null)

    try {
      const txHash = await writeContract({
        address: LIVES_TOKEN_ADDRESS as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "address", "name": "spender", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'approve',
        args: [spender as `0x${string}`, BigInt(amount * 1e18)]
      })
      
      toast.success('LIVES approved successfully!')
      return { success: true, tx: txHash }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approval failed'
      console.error('Error approving LIVES:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [ethConnected, writeContract])

  const transfer = useCallback(async (to: string, amount: number) => {
    if (!ethConnected && !solConnected) {
      toast.error('Please connect your wallet')
      return { success: false, error: 'Wallet not connected' }
    }

    setLoading(true)
    setError(null)

    try {
      if (currentNetwork === 'ethereum' && ethConnected) {
        // Ethereum transfer using wagmi
        // Mock implementation - en producción sería una llamada real al contrato ERC20
        toast.success(`Transferred ${amount} LIVES to ${to}`)
        await fetchEthBalance()
        return { success: true, tx: '0x...' }
      } else if (currentNetwork === 'solana' && solAddress) {
        // Solana transfer
        // Mock implementation - en producción sería una llamada real al programa SPL Token
        toast.success(`Transferred ${amount} LIVES to ${to}`)
        await fetchSolBalance()
        return { success: true, tx: '0x...' }
      } else {
        throw new Error('Invalid network configuration')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed'
      console.error('Error transferring LIVES:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [currentNetwork, ethConnected, solConnected, solAddress, fetchEthBalance, fetchSolBalance])

  useEffect(() => {
    if (currentNetwork === 'ethereum' && ethAddress) {
      fetchEthBalance()
    } else if (currentNetwork === 'solana' && solAddress) {
      fetchSolBalance()
    } else if (ethAddress && ethBalance) {
      setBalance(parseFloat(ethBalance.formatted))
    }
  }, [currentNetwork, ethAddress, solAddress, ethBalance, fetchEthBalance, fetchSolBalance])

  return {
    balance,
    loading: loading || ethLoading,
    error,
    currentNetwork,
    calculateDiscount,
    formatBalance,
    hasEnoughBalance,
    getDiscountAmount,
    getDiscountPercentage,
    approve,
    transfer,
    refetch: currentNetwork === 'ethereum' ? fetchEthBalance : fetchSolBalance,
    isConnected: ethConnected || solConnected
  }
}

export function useShieldToken() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { address: ethAddress } = useAccount()
  const { publicKey: solAddress } = useWallet()
  const { connection } = useConnection()

  // Ethereum/Base balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: ethAddress,
    token: process.env.NEXT_PUBLIC_SHIELD_TOKEN as `0x${string}`,
  })

  // Fetch Solana balance
  const fetchSolBalance = async () => {
    if (!solAddress || !connection) return

    setLoading(true)
    setError(null)

    try {
      // Mock implementation - en producción sería una llamada real al token
      const mockBalance = Math.random() * 5000 // Random balance for demo
      setBalance(mockBalance)
    } catch (error) {
      console.error('Error fetching SHIELD balance:', error)
      setError('Failed to fetch balance')
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = () => {
    return formatNumber(balance)
  }

  const hasEnoughBalance = (requiredAmount: number) => {
    return balance >= requiredAmount
  }

  useEffect(() => {
    if (ethAddress && ethBalance) {
      setBalance(parseFloat(ethBalance.formatted))
    } else if (solAddress) {
      fetchSolBalance()
    }
  }, [ethAddress, ethBalance, solAddress])

  return {
    balance,
    loading: loading || ethLoading,
    error,
    formatBalance,
    hasEnoughBalance,
    refetch: fetchSolBalance,
  }
}

export function useTokenPrices() {
  const [prices, setPrices] = useState({
    lives: 0.85,
    shield: 0.42,
    usdc: 1.00
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock implementation - en producción sería una llamada real a una API de precios
      const mockPrices = {
        lives: 0.85 + (Math.random() - 0.5) * 0.1, // ±5% variation
        shield: 0.42 + (Math.random() - 0.5) * 0.05,
        usdc: 1.00
      }
      
      setPrices(mockPrices)
    } catch (error) {
      console.error('Error fetching token prices:', error)
      setError('Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }

  const getPriceInUSD = (token: 'lives' | 'shield' | 'usdc', amount: number) => {
    return amount * prices[token]
  }

  const getTokenAmount = (token: 'lives' | 'shield' | 'usdc', usdAmount: number) => {
    return usdAmount / prices[token]
  }

  useEffect(() => {
    fetchPrices()
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    prices,
    loading,
    error,
    getPriceInUSD,
    getTokenAmount,
    refetch: fetchPrices,
  }
}
