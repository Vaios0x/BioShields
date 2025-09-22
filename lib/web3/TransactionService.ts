import { ethers } from 'ethers'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { BioShieldProgram } from '@/lib/solana/bioshield-program'
import { BioShieldContractService } from '@/lib/ethereum/bioshield-contracts'
import { TriggerConditions } from '@/types'

export interface TransactionResult {
  success: boolean
  tx?: string
  error?: string
  data?: any
}

export interface PolicyCreationParams {
  coverageAmount: number
  premium: number
  triggerConditions: TriggerConditions
  payWithLives: boolean
}

export interface ClaimSubmissionParams {
  policyId: string
  evidence: any
}

export class TransactionService {
  private ethereumService?: BioShieldContractService
  private solanaService?: BioShieldProgram
  private currentNetwork: 'ethereum' | 'solana'

  constructor(
    network: 'ethereum' | 'solana',
    ethereumProvider?: ethers.Provider,
    ethereumSigner?: ethers.Signer,
    solanaConnection?: Connection,
    solanaWallet?: any
  ) {
    this.currentNetwork = network

    if (network === 'ethereum' && ethereumProvider && ethereumSigner) {
      this.ethereumService = new BioShieldContractService(ethereumProvider, ethereumSigner)
    }

    if (network === 'solana' && solanaConnection && solanaWallet) {
      this.solanaService = new BioShieldProgram(solanaConnection, solanaWallet)
    }
  }

  async createPolicy(params: PolicyCreationParams): Promise<TransactionResult> {
    try {
      if (this.currentNetwork === 'ethereum' && this.ethereumService) {
        const result = await this.ethereumService.createPolicy(
          BigInt(params.coverageAmount),
          BigInt(params.premium),
          JSON.stringify(params.triggerConditions),
          params.payWithLives
        )
        return {
          success: result.success,
          tx: result.tx,
          error: result.error,
          data: { policyId: result.policyId }
        }
      } else if (this.currentNetwork === 'solana' && this.solanaService) {
        const result = await this.solanaService.createCoverage(
          params.coverageAmount,
          params.premium,
          params.triggerConditions,
          params.payWithLives
        )
        return {
          success: result.success,
          tx: result.tx,
          error: result.error,
          data: { coverageId: result.coverageId }
        }
      } else {
        throw new Error('Invalid network configuration')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async submitClaim(params: ClaimSubmissionParams): Promise<TransactionResult> {
    try {
      if (this.currentNetwork === 'ethereum' && this.ethereumService) {
        const policyIdNumber = parseInt(params.policyId.replace('ETH-', ''))
        const result = await this.ethereumService.submitClaim(policyIdNumber, JSON.stringify(params.evidence))
        return {
          success: result.success,
          tx: result.tx,
          error: result.error,
          data: { claimId: result.claimId }
        }
      } else if (this.currentNetwork === 'solana' && this.solanaService) {
        const result = await this.solanaService.processClaim(params.policyId, params.evidence)
        return {
          success: result.success,
          tx: result.tx,
          error: result.error
        }
      } else {
        throw new Error('Invalid network configuration')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getPolicies(userAddress: string): Promise<TransactionResult> {
    try {
      if (this.currentNetwork === 'ethereum' && this.ethereumService) {
        const policies = await this.ethereumService.getUserPolicies(userAddress)
        return {
          success: true,
          data: { policies }
        }
      } else if (this.currentNetwork === 'solana' && this.solanaService) {
        const result = await this.solanaService.getActivePolicies(userAddress)
        return {
          success: result.success,
          error: result.error,
          data: { policies: result.policies }
        }
      } else {
        throw new Error('Invalid network configuration')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getPoolStats(): Promise<TransactionResult> {
    try {
      if (this.currentNetwork === 'ethereum' && this.ethereumService) {
        const stats = await this.ethereumService.getPoolStats()
        return {
          success: true,
          data: { stats }
        }
      } else if (this.currentNetwork === 'solana' && this.solanaService) {
        const result = await this.solanaService.getPoolStats()
        return {
          success: result.success,
          error: result.error,
          data: { stats: result.stats }
        }
      } else {
        throw new Error('Invalid network configuration')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async approveLives(spender: string, amount: number): Promise<TransactionResult> {
    try {
      if (this.currentNetwork === 'ethereum' && this.ethereumService) {
        const result = await this.ethereumService.approveLives(spender, BigInt(amount * 1e18))
        return {
          success: result.success,
          tx: result.tx,
          error: result.error
        }
      } else {
        throw new Error('LIVES approval only supported on Ethereum')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getLivesBalance(userAddress: string): Promise<TransactionResult> {
    try {
      if (this.currentNetwork === 'ethereum' && this.ethereumService) {
        const balance = await this.ethereumService.getLivesBalance(userAddress)
        return {
          success: true,
          data: { balance: Number(balance) / 1e18 }
        }
      } else {
        throw new Error('LIVES balance only supported on Ethereum')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  getCurrentNetwork(): 'ethereum' | 'solana' {
    return this.currentNetwork
  }

  isEthereum(): boolean {
    return this.currentNetwork === 'ethereum'
  }

  isSolana(): boolean {
    return this.currentNetwork === 'solana'
  }
}

// Factory function to create transaction service
export function createTransactionService(
  network: 'ethereum' | 'solana',
  ethereumProvider?: ethers.Provider,
  ethereumSigner?: ethers.Signer,
  solanaConnection?: Connection,
  solanaWallet?: any
): TransactionService {
  return new TransactionService(
    network,
    ethereumProvider,
    ethereumSigner,
    solanaConnection,
    solanaWallet
  )
}
