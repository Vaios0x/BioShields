'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient, useWriteContract, useReadContract } from 'wagmi'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { BioShieldProgram } from '@/lib/solana/bioshield-program'
import { InsurancePolicy, Claim, TriggerConditions } from '@/types'
import { Connection, PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

// Contract addresses and ABI
const BIOSHIELD_ADDRESS = process.env.NEXT_PUBLIC_BIOSHIELD_CONTRACT || '0x...'
const BIOSHIELD_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "premium", "type": "uint256" },
      { "internalType": "string", "name": "triggerConditions", "type": "string" }
    ],
    "name": "createPolicy",
    "outputs": [{ "internalType": "uint256", "name": "policyId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserPolicies",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "premium", "type": "uint256" },
          { "internalType": "uint256", "name": "startDate", "type": "uint256" },
          { "internalType": "uint256", "name": "endDate", "type": "uint256" },
          { "internalType": "uint8", "name": "status", "type": "uint8" }
        ],
        "internalType": "struct BioShield.Policy",
        "name": "",
        "type": "tuple[]"
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
      {
        "components": [
          { "internalType": "uint256", "name": "totalLiquidity", "type": "uint256" },
          { "internalType": "uint256", "name": "activePolicies", "type": "uint256" },
          { "internalType": "uint256", "name": "totalClaims", "type": "uint256" },
          { "internalType": "uint256", "name": "averageApy", "type": "uint256" }
        ],
        "internalType": "struct BioShield.PoolStats",
        "name": "",
        "type": "tuple"
      }
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
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { writeContractAsync: writeContract } = useWriteContract()
  
  // Contract read hooks
  const { data: userPolicies } = useReadContract({
    address: BIOSHIELD_ADDRESS as `0x${string}`,
    abi: BIOSHIELD_ABI,
    functionName: 'getUserPolicies',
    args: ethAddress ? [ethAddress] : undefined,
    query: { enabled: !!ethAddress }
  })
  
  const { data: poolStats } = useReadContract({
    address: BIOSHIELD_ADDRESS as `0x${string}`,
    abi: BIOSHIELD_ABI,
    functionName: 'getPoolStats'
  })
  
  // Solana hooks
  const { connection: solanaConnection } = useConnection()
  const { publicKey: solanaAddress, connected: solanaConnected } = useWallet()

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
      if (currentNetwork === 'ethereum' && ethAddress && userPolicies) {
        // Use data from wagmi hooks
        const mappedPolicies: InsurancePolicy[] = userPolicies.map((policy: any) => ({
          id: `ETH-${policy.id}`,
          type: 'clinical_trial', // Default type
          coverageAmount: Number(policy.coverageAmount),
          premium: Number(policy.premium),
          startDate: new Date(Number(policy.startDate) * 1000),
          endDate: new Date(Number(policy.endDate) * 1000),
          status: policy.status === 0 ? 'active' : policy.status === 1 ? 'expired' : 'cancelled',
          triggerConditions: {
            clinicalTrialId: 'NCT12345678',
            dataSource: 'clinicaltrials.gov'
          },
          createdAt: new Date(Number(policy.startDate) * 1000),
          updatedAt: new Date()
        }))
        
        setPolicies(mappedPolicies)
      } else if (currentNetwork === 'solana' && solanaAddress && solanaConnection) {
        // Fetch from Solana using real program
        const solanaProgram = new BioShieldProgram(solanaConnection, { publicKey: solanaAddress } as any)
        const result = await solanaProgram.getActivePolicies(solanaAddress.toString())
        
        if (result.success) {
          const mappedPolicies: InsurancePolicy[] = result.policies.map((policy) => ({
            id: `SOL-${policy.id}`,
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
        const txHash = await writeContract({
          address: BIOSHIELD_ADDRESS as `0x${string}`,
          abi: BIOSHIELD_ABI,
          functionName: 'createPolicy',
          args: [
            BigInt(coverageAmount),
            BigInt(premium),
            JSON.stringify(triggerConditions)
          ]
        })
        
        result = {
          success: true,
          tx: txHash,
          policyId: 'pending'
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

      if (result.success) {
        toast.success('Policy created successfully!')
        await fetchPolicies() // Refresh policies
        return result
      } else {
        throw new Error(result.error || 'Failed to create policy')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create policy'
      console.error('Error creating policy:', err)
      setError(errorMessage)
      toast.error(errorMessage)
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
          address: BIOSHIELD_ADDRESS as `0x${string}`,
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
        return {
          success: true,
          stats: {
            totalLiquidity: Number(poolStats.totalLiquidity),
            activePolicies: Number(poolStats.activePolicies),
            totalClaims: Number(poolStats.totalClaims),
            averageApy: Number(poolStats.averageApy) / 100 // Convert from basis points
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