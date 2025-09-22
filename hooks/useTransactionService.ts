'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient, useWriteContract } from 'wagmi'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { BioShieldProgram } from '@/lib/solana/bioshield-program'
import { useWeb3Connection } from './useWeb3Connection'

// Simplified transaction service interface
export interface TransactionService {
  createPolicy: (params: any) => Promise<any>
  submitClaim: (params: any) => Promise<any>
  getPoolStats: () => Promise<any>
}

export function useTransactionService(): TransactionService | null {
  const { currentNetwork, isConnected } = useWeb3Connection()
  
  // Ethereum hooks
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { writeContractAsync: writeContract } = useWriteContract()
  
  // Solana hooks with error handling
  let solanaConnection: any = null
  let solanaAddress: any = null
  let solanaWallet: any = null
  
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
    solanaWallet = walletResult.wallet
  } catch (error) {
    console.warn('Solana wallet not available:', error)
    solanaAddress = null
    solanaWallet = null
  }

  const transactionService = useMemo(() => {
    if (!isConnected) return null

    try {
      if (currentNetwork === 'ethereum' && publicClient && walletClient) {
        // Return a simplified service for Ethereum using wagmi hooks
        return {
          createPolicy: async (params: any) => {
            // This would use writeContract for policy creation
            // Implementation depends on specific contract calls needed
            return { success: true, message: 'Policy creation not implemented yet' }
          },
          submitClaim: async (params: any) => {
            // This would use writeContract for claim submission
            return { success: true, message: 'Claim submission not implemented yet' }
          },
          getPoolStats: async () => {
            // This would use readContract for pool stats
            return { success: true, stats: { totalLiquidity: 0, activePolicies: 0 } }
          }
        }
      } else if (currentNetwork === 'solana' && solanaConnection && solanaAddress) {
        // Use Solana program directly
        const solanaProgram = new BioShieldProgram(solanaConnection, { publicKey: solanaAddress } as any)
        return {
          createPolicy: async (params: any) => {
            return await solanaProgram.createCoverage(
              params.coverageAmount,
              params.premium,
              params.triggerConditions,
              params.payWithLives
            )
          },
          submitClaim: async (params: any) => {
            return await solanaProgram.processClaim(params.policyId, params.evidence)
          },
          getPoolStats: async () => {
            return await solanaProgram.getPoolStats()
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error creating transaction service:', error)
      return null
    }
  }, [
    currentNetwork,
    isConnected,
    publicClient,
    walletClient,
    writeContract,
    solanaConnection,
    solanaAddress,
    solanaWallet
  ])

  return transactionService
}
