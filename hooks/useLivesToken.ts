'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useBalance, useWriteContract, useReadContract, useChainId, usePublicClient } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

// Get the correct LIVES token address based on the current network
const getLivesTokenAddress = (chainId?: number) => {
  // Base Sepolia (chainId: 84532)
  if (chainId === 84532) {
    return process.env.NEXT_PUBLIC_BASE_LIVES_TOKEN || '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279'
  }
  // Optimism Sepolia (chainId: 11155420)
  if (chainId === 11155420) {
    return process.env.NEXT_PUBLIC_OPTIMISM_LIVES_TOKEN || '0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2'
  }
  // Default fallback - use a valid Ethereum address
  return '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279'
}

// Get the correct SHIELD token address based on the current network
const getShieldTokenAddress = (chainId?: number) => {
  // Base Sepolia (chainId: 84532)
  if (chainId === 84532) {
    return process.env.NEXT_PUBLIC_BASE_SHIELD_TOKEN || '0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE'
  }
  // Optimism Sepolia (chainId: 11155420)
  if (chainId === 11155420) {
    return process.env.NEXT_PUBLIC_OPTIMISM_SHIELD_TOKEN || '0x15164c7C1E5ced9788c2fB82424fe595950ee261'
  }
  // Default fallback - use a valid Ethereum address
  return '0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE'
}

export function useLivesToken() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<'solana' | 'ethereum'>('ethereum')
  
  const { address: ethAddress, isConnected: ethConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  
  // Get the correct token address for the current network
  const livesTokenAddress = getLivesTokenAddress(chainId)
  
  // Solana hooks with error handling
  let solAddress: any = null
  let solConnected: boolean = false
  let connection: any = null
  
  try {
    const walletResult = useWallet()
    solAddress = walletResult.publicKey
    solConnected = walletResult.connected
  } catch (error) {
    console.warn('Solana wallet not available:', error)
    solAddress = null
    solConnected = false
  }
  
  try {
    const connectionResult = useConnection()
    connection = connectionResult.connection
  } catch (error) {
    console.warn('Solana connection not available:', error)
    connection = null
  }
  
  // Wagmi hooks for contract interactions
  const { writeContractAsync: writeContract } = useWriteContract()
  const { data: livesBalance } = useReadContract({
    address: livesTokenAddress as `0x${string}`,
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
    token: livesTokenAddress as `0x${string}`,
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
      // Verificar que estamos en una red soportada
      if (chainId !== 84532 && chainId !== 11155420) { // Base Sepolia o Optimism Sepolia
        toast.error('Please switch to Base Sepolia or Optimism Sepolia network')
        return { success: false, error: 'Wrong network' }
      }

      // Verificar que el spender es una dirección válida
      if (!spender || spender === '0x0000000000000000000000000000000000000000') {
        toast.error('Invalid spender address')
        return { success: false, error: 'Invalid spender address' }
      }

      // Calcular el monto con precisión
      const amountWei = BigInt(amount) * BigInt(10 ** 18)
      
      console.log('Approving LIVES token:', {
        tokenAddress: livesTokenAddress,
        spender,
        amount: amount.toString(),
        amountWei: amountWei.toString(),
        chainId,
        network: chainId === 84532 ? 'Base Sepolia' : chainId === 11155420 ? 'Optimism Sepolia' : 'Unknown'
      })

      // Verificar si el contrato existe antes de intentar la transacción
      try {
        const code = await publicClient?.getBytecode({ address: livesTokenAddress as `0x${string}` })
        console.log('Contract bytecode check:', { 
          address: livesTokenAddress, 
          hasCode: code && code !== '0x',
          codeLength: code?.length 
        })
        
        if (!code || code === '0x') {
          console.error('LIVES token contract not found at address:', livesTokenAddress)
          // No mostrar toast de error en demo mode - esto es esperado
          console.log('LIVES token contract not available - this is expected in demo mode')
          return { success: false, error: 'Contract not found', isDemoMode: true }
        }
      } catch (contractError) {
        console.error('Could not verify contract existence:', contractError)
        toast.error('Could not verify LIVES token contract')
        return { success: false, error: 'Contract verification failed' }
      }

      try {
        const txHash = await writeContract({
          address: livesTokenAddress as `0x${string}`,
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
          args: [spender as `0x${string}`, amountWei]
        })
        
        toast.success('LIVES approved successfully!')
        return { success: true, tx: txHash }
      } catch (contractError) {
        // Detect specific contract errors
        const errorMessage = contractError instanceof Error ? contractError.message : 'Contract error'
        console.error('Contract approval error:', {
          error: contractError,
          message: errorMessage,
          tokenAddress: livesTokenAddress,
          spender,
          amount: amountWei.toString(),
          chainId
        })
        
        // Check if it's a contract revert error
        if (errorMessage.includes('reverted') || errorMessage.includes('ContractFunctionExecutionError')) {
          console.log('Contract approval reverted, this is expected for demo purposes')
          // No mostrar toast de error en demo mode - esto es esperado
          return { 
            success: false, 
            error: 'Contract approval reverted - using fallback',
            isContractError: true,
            isDemoMode: true
          }
        }
        
        // Check for specific error types
        if (errorMessage.includes('insufficient funds')) {
          toast.error('Insufficient funds for gas fees')
          return { success: false, error: 'Insufficient funds for gas' }
        }
        
        if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
          toast.error('Transaction rejected by user')
          return { success: false, error: 'User rejected transaction' }
        }
        
        // Re-throw other errors
        throw contractError
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approval failed'
      console.error('Error approving LIVES:', err)
      setError(errorMessage)
      
      // Proporcionar mensajes de error más específicos
      if (errorMessage.includes('Internal JSON-RPC error')) {
        toast.error('Contract error: The LIVES token contract may not be properly deployed or may not have the approve function')
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Insufficient funds for gas fees')
      } else if (errorMessage.includes('user rejected')) {
        toast.error('Transaction rejected by user')
      } else {
        toast.error(`Approval failed: ${errorMessage}`)
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [ethConnected, writeContract, chainId, livesTokenAddress, publicClient])

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
  const chainId = useChainId()
  
  // Get the correct token address for the current network
  const shieldTokenAddress = getShieldTokenAddress(chainId)
  
  // Solana hooks with error handling
  let solAddress: any = null
  let connection: any = null
  
  try {
    const walletResult = useWallet()
    solAddress = walletResult.publicKey
  } catch (error) {
    console.warn('Solana wallet not available:', error)
    solAddress = null
  }
  
  try {
    const connectionResult = useConnection()
    connection = connectionResult.connection
  } catch (error) {
    console.warn('Solana connection not available:', error)
    connection = null
  }

  // Ethereum/Base balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: ethAddress,
    token: shieldTokenAddress as `0x${string}`,
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
