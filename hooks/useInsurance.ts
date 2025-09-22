'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { BioShieldProgram } from '@/lib/solana/bioshield-program'
import { BioShieldContractService } from '@/lib/ethereum/bioshield-contracts'
import { InsurancePolicy, Claim, TriggerConditions } from '@/types'
import toast from 'react-hot-toast'

export function useInsurance() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { address: ethAddress, isConnected } = useAccount()

  const fetchPolicies = useCallback(async () => {
    if (!isConnected && !ethAddress) {
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
      if (ethAddress) {
        // Fetch from Ethereum/Base
        // Mock implementation - en producción sería una llamada real
        const mockPolicies: InsurancePolicy[] = [
          {
            id: 'BS-ETH-001',
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
    } catch (error) {
      console.error('Error fetching policies:', error)
      setError('Failed to fetch policies')
      toast.error('Failed to fetch policies')
    } finally {
      setLoading(false)
    }
  }, [isConnected, ethAddress])

  const createCoverage = async (params: {
    type: InsurancePolicy['type']
    coverageAmount: number
    premium: number
    triggerConditions: TriggerConditions
    payWithLives: boolean
  }) => {
    if (!isConnected && !ethAddress) {
      toast.error('Please connect your wallet')
      return { success: false, error: 'Wallet not connected' }
    }

    setLoading(true)
    setError(null)

    try {
      if (ethAddress) {
        // Create on Ethereum/Base
        // Mock implementation
        const newPolicy: InsurancePolicy = {
          id: `BS-ETH-${Date.now()}`,
          type: params.type,
          coverageAmount: params.coverageAmount,
          premium: params.payWithLives ? params.premium * 0.5 : params.premium,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          status: 'active',
          triggerConditions: params.triggerConditions,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setPolicies(prev => [...prev, newPolicy])
        toast.success('Coverage created successfully')
        return { success: true, policyId: newPolicy.id }
      }
    } catch (error) {
      console.error('Error creating coverage:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const submitClaim = async (policyId: string, evidence: any) => {
    if (!isConnected && !ethAddress) {
      toast.error('Please connect your wallet')
      return { success: false, error: 'Wallet not connected' }
    }

    setLoading(true)
    setError(null)

    try {
      if (ethAddress) {
        // Submit on Ethereum/Base
        // Mock implementation
        const newClaim: Claim = {
          id: `CL-${Date.now()}`,
          policyId,
          amount: 0, // Will be calculated based on policy
          status: 'pending',
          evidence: [evidence],
          submittedAt: new Date()
        }

        setClaims(prev => [...prev, newClaim])
        toast.success('Claim submitted successfully')
        return { success: true, claimId: newClaim.id }
      }
    } catch (error) {
      console.error('Error submitting claim:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const getPolicyById = (id: string) => {
    return policies.find(policy => policy.id === id)
  }

  const getClaimsByPolicy = (policyId: string) => {
    return claims.filter(claim => claim.policyId === policyId)
  }

  const getActivePolicies = () => {
    return policies.filter(policy => policy.status === 'active')
  }

  const getExpiredPolicies = () => {
    return policies.filter(policy => policy.status === 'expired')
  }

  const getClaimedPolicies = () => {
    return policies.filter(policy => policy.status === 'claimed')
  }

  useEffect(() => {
    if (isConnected || ethAddress) {
      fetchPolicies()
    }
  }, [isConnected, ethAddress, fetchPolicies])

  return {
    policies,
    claims,
    loading,
    error,
    createCoverage,
    submitClaim,
    getPolicyById,
    getClaimsByPolicy,
    getActivePolicies,
    getExpiredPolicies,
    getClaimedPolicies,
    refetch: fetchPolicies,
  }
}
