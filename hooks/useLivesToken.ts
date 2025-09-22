'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

const LIVES_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LIVES_TOKEN || '0x...'

export function useLivesToken() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { address: ethAddress } = useAccount()
  const { publicKey: solAddress } = useWallet()
  const { connection } = useConnection()

  // Ethereum/Base balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: ethAddress,
    token: LIVES_TOKEN_ADDRESS as `0x${string}`,
  })

  // Fetch Solana balance
  const fetchSolBalance = async () => {
    if (!solAddress || !connection) return

    setLoading(true)
    setError(null)

    try {
      // Mock implementation - en producción sería una llamada real al token
      const mockBalance = Math.random() * 10000 // Random balance for demo
      setBalance(mockBalance)
    } catch (error) {
      console.error('Error fetching SOL balance:', error)
      setError('Failed to fetch balance')
    } finally {
      setLoading(false)
    }
  }

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
    calculateDiscount,
    formatBalance,
    hasEnoughBalance,
    getDiscountAmount,
    getDiscountPercentage,
    refetch: fetchSolBalance,
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
