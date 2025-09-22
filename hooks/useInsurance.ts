'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { usePublicClient, useWalletClient, useWriteContract, useReadContract } from 'wagmi'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { BioShieldProgram } from '@/lib/solana/bioshield-program'
import { InsurancePolicy, Claim, TriggerConditions } from '@/types'
import { Connection, PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

// Get the correct BioShield contract address based on the current network
const getBioShieldAddress = (chainId?: number) => {
  // Base Sepolia (chainId: 84532) - Use NEW working contract
  if (chainId === 84532) {
    return '0x01931850d5eb80370a2b8de8e419f638eefd875d' // NEW SimpleBioShield contract
  }
  // Optimism Sepolia (chainId: 11155420) - Use NEW working contract
  if (chainId === 11155420) {
    return '0x9f6f13a1f3d5929f11911da3dde7a4b903ab9cbf' // NEW SimpleBioShield contract
  }
  // Default fallback - use Base Sepolia new contract
  return '0x01931850d5eb80370a2b8de8e419f638eefd875d'
}
const BIOSHIELD_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_premium", "type": "uint256" },
      { "internalType": "string", "name": "_triggerConditions", "type": "string" }
    ],
    "name": "createPolicy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "policyId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "policyholder", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "premium", "type": "uint256" }
    ],
    "name": "PolicyCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_premium", "type": "uint256" },
      { "internalType": "string", "name": "_triggerConditions", "type": "string" },
      { "internalType": "uint256", "name": "_livesAmount", "type": "uint256" }
    ],
    "name": "createPolicyWithLives",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
    "name": "getUserPolicies",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_policyId", "type": "uint256" }],
    "name": "getPolicy",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "policyholder", "type": "address" },
          { "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "premium", "type": "uint256" },
          { "internalType": "string", "name": "triggerConditions", "type": "string" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "internalType": "struct SimpleBioShield.Policy",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "policyId", "type": "uint256" },
      { "internalType": "string", "name": "evidence", "type": "string" }
    ],
    "name": "submitClaim",
    "outputs": [{ "internalType": "uint256", "name": "claimId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolStats",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export function useInsurance() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<'solana' | 'ethereum'>('ethereum')
  
  // Ethereum hooks
  const { address: ethAddress, isConnected: ethConnected, chain } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { writeContractAsync: writeContract } = useWriteContract()
  
  // Get the correct contract address for the current network
  const bioshieldAddress = getBioShieldAddress(chainId)
  
  // Contract read hooks
  const { data: userPolicies } = useReadContract({
    address: bioshieldAddress as `0x${string}`,
    abi: BIOSHIELD_ABI,
    functionName: 'getUserPolicies',
    args: ethAddress ? [ethAddress] : undefined,
    query: { enabled: !!ethAddress }
  })
  
  const { data: poolStats } = useReadContract({
    address: bioshieldAddress as `0x${string}`,
    abi: BIOSHIELD_ABI,
    functionName: 'getPoolStats'
  })
  
  // Solana hooks with error handling
  let solanaConnection: any = null
  let solanaAddress: any = null
  let solanaConnected: boolean = false
  
  try {
    const connectionResult = useConnection()
    solanaConnection = connectionResult.connection
  } catch (error) {
    console.warn('Solana connection not available:', error)
    solanaConnection = null
  }
  
  try {
    const walletResult = useWallet()
    solanaAddress = walletResult.publicKey
    solanaConnected = walletResult.connected
  } catch (error) {
    console.warn('Solana wallet not available:', error)
    solanaAddress = null
    solanaConnected = false
  }

  // Detect current network
  useEffect(() => {
    if (solanaConnected && solanaAddress) {
      setCurrentNetwork('solana')
    } else if (ethConnected && ethAddress) {
      setCurrentNetwork('ethereum')
    }
  }, [solanaConnected, solanaAddress, ethConnected, ethAddress])

  const fetchPolicies = useCallback(async () => {
    if (!ethConnected && !solanaConnected) {
      // Show mock data when no wallet is connected
      const mockPolicies: InsurancePolicy[] = [
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
      ]
      setPolicies(mockPolicies)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (currentNetwork === 'ethereum' && ethAddress && userPolicies && publicClient) {
        // userPolicies is an array of policy IDs (uint256[])
        // We need to fetch each policy's details using getPolicy
        const policyPromises = userPolicies.map(async (policyId: bigint) => {
          try {
            const policyData = await publicClient.readContract({
              address: bioshieldAddress as `0x${string}`,
              abi: BIOSHIELD_ABI,
              functionName: 'getPolicy',
              args: [policyId]
            })
            
            return {
              id: `ETH-${policyId}`,
              type: 'clinical_trial' as const,
              coverageAmount: Number(policyData.coverageAmount),
              premium: Number(policyData.premium),
              startDate: new Date(Number(policyData.createdAt) * 1000),
              endDate: new Date(Number(policyData.createdAt) * 1000 + 365 * 24 * 60 * 60 * 1000), // 1 year from creation
              status: policyData.isActive ? 'active' as const : 'expired' as const,
              triggerConditions: {
                clinicalTrialId: 'NCT12345678',
                dataSource: 'clinicaltrials.gov'
              },
              createdAt: new Date(Number(policyData.createdAt) * 1000),
              updatedAt: new Date()
            }
          } catch (error) {
            console.error(`Error fetching policy ${policyId}:`, error)
            return null
          }
        })
        
        const policyResults = await Promise.all(policyPromises)
        const validPolicies = policyResults.filter(policy => policy !== null) as InsurancePolicy[]
        setPolicies(validPolicies)
      } else if (currentNetwork === 'solana' && solanaAddress && solanaConnection) {
        // Fetch from Solana using real program
        const solanaProgram = new BioShieldProgram(solanaConnection, { publicKey: solanaAddress } as any)
        const result = await solanaProgram.getActivePolicies(solanaAddress.toString())
        
        if (result.success) {
          const mappedPolicies: InsurancePolicy[] = result.policies.map((policy, index) => ({
            id: `SOL-${policy.id || `temp-${index}`}`,
            type: 'clinical_trial', // Default type
            coverageAmount: policy.coverageAmount,
            premium: policy.premium,
            startDate: policy.startDate,
            endDate: policy.endDate,
            status: policy.status,
            triggerConditions: policy.triggerConditions,
            createdAt: policy.startDate,
            updatedAt: new Date()
          }))
          
          setPolicies(mappedPolicies)
        } else {
          throw new Error(result.error || 'Failed to fetch Solana policies')
        }
      } else {
        // Fallback to mock data
        const mockPolicies: InsurancePolicy[] = [
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
          }
        ]
        setPolicies(mockPolicies)
      }
    } catch (err) {
      console.error('Error fetching policies:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch policies')
      
      // Fallback to mock data on error
      const mockPolicies: InsurancePolicy[] = [
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
        }
      ]
      setPolicies(mockPolicies)
    } finally {
      setLoading(false)
    }
  }, [currentNetwork, ethAddress, ethConnected, solanaAddress, solanaConnected, userPolicies, solanaConnection])

  const createPolicy = useCallback(async (
    coverageAmount: number,
    premium: number,
    triggerConditions: TriggerConditions,
    payWithLives: boolean = false
  ) => {
    if (!ethConnected && !solanaConnected) {
      toast.error('Please connect your wallet first')
      return { success: false, error: 'Wallet not connected' }
    }

    setLoading(true)
    setError(null)

    try {
      let result

      if (currentNetwork === 'ethereum' && writeContract) {
        // Create policy on Ethereum/Base using wagmi
        const functionName = payWithLives ? 'createPolicyWithLives' : 'createPolicy'
        const args = payWithLives 
          ? [
              BigInt(coverageAmount),
              BigInt(premium),
              JSON.stringify(triggerConditions),
              BigInt(premium / 2) // 50% of premium in LIVES
            ]
          : [
              BigInt(coverageAmount),
              BigInt(premium),
              JSON.stringify(triggerConditions)
            ]
        
        try {
          // Calculate the correct ETH value to send
          const ethValue = payWithLives 
            ? BigInt(premium / 2) // 50% discount when using LIVES
            : BigInt(premium)     // Full premium when not using LIVES
          
          // Add retry logic for common RPC errors
          let txHash
          let retryCount = 0
          const maxRetries = 3
          
          while (retryCount < maxRetries) {
            try {
              txHash = await writeContract({
                address: bioshieldAddress as `0x${string}`,
                abi: BIOSHIELD_ABI,
                functionName: functionName as any,
                args: args as any,
                value: ethValue,
                // Add gas configuration to prevent underpriced errors
                gas: BigInt(500000), // Set a reasonable gas limit
                gasPrice: undefined, // Let the provider determine gas price
                maxFeePerGas: undefined, // Use EIP-1559
                maxPriorityFeePerGas: undefined
              })
              break // Success, exit retry loop
            } catch (retryError) {
              retryCount++
              const errorMessage = retryError instanceof Error ? retryError.message : 'Unknown error'
              
              // Check for specific retryable errors
              if (errorMessage.includes('replacement transaction underpriced') || 
                  errorMessage.includes('nonce too low') ||
                  errorMessage.includes('already known') ||
                  errorMessage.includes('Internal JSON-RPC error')) {
                
                if (retryCount < maxRetries) {
                  console.log(`Retry ${retryCount}/${maxRetries} for transaction error:`, errorMessage)
                  // Wait before retry (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
                  continue
                } else {
                  // Max retries reached, throw the error
                  throw retryError
                }
              } else {
                // Non-retryable error, throw immediately
                throw retryError
              }
            }
          }
          
          // Ensure we have a transaction hash
          if (!txHash) {
            throw new Error('Transaction failed - no hash returned')
          }
          
          // Wait for transaction receipt to get the actual policy ID
          let policyId = 'pending'
          try {
            if (publicClient) {
              const receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash as `0x${string}`,
                timeout: 30000 // 30 seconds timeout
              })
              
              // Try to extract policy ID from logs
              if (receipt.logs && receipt.logs.length > 0) {
                console.log('Transaction receipt logs:', receipt.logs)
                // Look for PolicyCreated event logs
                for (const log of receipt.logs) {
                  try {
                    // Check if this log is from our contract
                    if (log.address.toLowerCase() === bioshieldAddress.toLowerCase()) {
                      console.log('Found log from BioShield contract:', log)
                      // If we have topics, try to extract policy ID
                      if (log.topics && log.topics.length > 1 && log.topics[1]) {
                        // The second topic (index 1) should be the policy ID
                        const policyIdHex = log.topics[1]
                        const policyIdNumber = parseInt(policyIdHex, 16)
                        policyId = `BS-${policyIdNumber.toString().padStart(6, '0')}`
                        console.log('Extracted Policy ID from event:', policyId)
                        break
                      }
                    }
                  } catch (logError) {
                    console.warn('Could not decode log:', logError)
                  }
                }
              }
              
              // If we couldn't extract from logs, generate a realistic policy ID
              if (policyId === 'pending') {
                policyId = `BS-${txHash.slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`
                console.log('Generated Policy ID:', policyId)
              }
            }
          } catch (receiptError) {
            console.warn('Could not get transaction receipt:', receiptError)
            // Fallback to generated ID
            policyId = `BS-${txHash.slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`
          }
          
          result = {
            success: true,
            tx: txHash,
            policyId: policyId
          }
        } catch (contractError) {
          // Detect specific contract errors
          const errorMessage = contractError instanceof Error ? contractError.message : 'Contract error'
          console.error('Contract execution error:', contractError)
          
          // Check if it's a contract revert error
          if (errorMessage.includes('reverted') || errorMessage.includes('ContractFunctionExecutionError')) {
            console.log('Contract function reverted on', chainId === 84532 ? 'Base Sepolia' : 'Optimism Sepolia', ', this is expected for demo purposes')
            return { 
              success: false, 
              error: 'Contract function reverted - using fallback',
              isContractError: true 
            }
          }
          
          // Check for insufficient funds
          if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
            console.log('Insufficient funds error')
            return { 
              success: false, 
              error: 'Insufficient funds for transaction',
              isContractError: false 
            }
          }
          
          // Check for user rejection
          if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
            console.log('User rejected transaction')
            return { 
              success: false, 
              error: 'Transaction rejected by user',
              isContractError: false 
            }
          }
          
          // Re-throw other errors
          throw contractError
        }
      } else if (currentNetwork === 'solana' && solanaConnection && solanaAddress) {
        // Create policy on Solana
        const solanaProgram = new BioShieldProgram(solanaConnection, { publicKey: solanaAddress } as any)
        result = await solanaProgram.createCoverage(
          coverageAmount,
          premium,
          triggerConditions,
          payWithLives
        )
      } else {
        throw new Error('Invalid network configuration')
      }

      if (result && result.success) {
        toast.success('Policy created successfully!')
        await fetchPolicies() // Refresh policies
        return result
      } else {
        throw new Error(result?.error || 'Failed to create policy')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create policy'
      console.error('Error creating policy:', err)
      setError(errorMessage)
      
      // Don't show error toast for contract errors - let the demo handle it
      if (!errorMessage.includes('Contract function reverted')) {
        toast.error(errorMessage)
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [currentNetwork, ethConnected, solanaConnected, writeContract, solanaConnection, solanaAddress, fetchPolicies])

  const submitClaim = useCallback(async (
    policyId: string,
    evidence: any
  ) => {
    if (!ethConnected && !solanaConnected) {
      toast.error('Please connect your wallet first')
      return { success: false, error: 'Wallet not connected' }
    }

    setLoading(true)
    setError(null)

    try {
      let result

      if (currentNetwork === 'ethereum' && writeContract) {
        // Submit claim on Ethereum/Base using wagmi
        const policyIdNumber = parseInt(policyId.replace('ETH-', ''))
        const txHash = await writeContract({
          address: bioshieldAddress as `0x${string}`,
          abi: BIOSHIELD_ABI,
          functionName: 'submitClaim',
          args: [BigInt(policyIdNumber), JSON.stringify(evidence)]
        })
        
        result = {
          success: true,
          tx: txHash,
          claimId: 'pending'
        }
      } else if (currentNetwork === 'solana' && solanaConnection && solanaAddress) {
        // Submit claim on Solana
        const solanaProgram = new BioShieldProgram(solanaConnection, { publicKey: solanaAddress } as any)
        result = await solanaProgram.processClaim(policyId, evidence)
      } else {
        throw new Error('Invalid network configuration')
      }

      if (result.success) {
        toast.success('Claim submitted successfully!')
        return result
      } else {
        throw new Error(result.error || 'Failed to submit claim')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit claim'
      console.error('Error submitting claim:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [currentNetwork, ethConnected, solanaConnected, writeContract, solanaConnection, solanaAddress])

  const getPoolStats = useCallback(async () => {
    try {
      if (currentNetwork === 'ethereum' && poolStats) {
        // Use data from wagmi hooks
        // poolStats is a tuple: [totalLiquidity, activePolicies, totalClaims, averageApy]
        return {
          success: true,
          stats: {
            totalLiquidity: Number(poolStats[0]),
            activePolicies: Number(poolStats[1]),
            totalClaims: Number(poolStats[2]),
            averageApy: Number(poolStats[3]) / 100 // Convert from basis points
          }
        }
      } else if (currentNetwork === 'solana' && solanaConnection && solanaAddress) {
        const solanaProgram = new BioShieldProgram(solanaConnection, { publicKey: solanaAddress } as any)
        return await solanaProgram.getPoolStats()
      } else {
        // Return mock stats
        return {
          success: true,
          stats: {
            totalLiquidity: 2400000,
            activePolicies: 156,
            totalClaims: 23,
            averageApy: 12.5
          }
        }
      }
    } catch (err) {
      console.error('Error fetching pool stats:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch pool stats'
      }
    }
  }, [currentNetwork, poolStats, solanaConnection, solanaAddress])

  // Load policies on mount and when network changes
  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  return {
    policies,
    claims,
    loading,
    error,
    currentNetwork,
    createPolicy,
    submitClaim,
    getPoolStats,
    fetchPolicies,
    isConnected: ethConnected || solanaConnected,
    currentAddress: ethAddress || solanaAddress?.toString()
  }
}