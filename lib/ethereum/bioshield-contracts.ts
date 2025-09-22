import { ethers } from 'ethers'
import { useAccount, useWriteContract, useReadContract, useBalance } from 'wagmi'

// ABI simplificado para BioShield (mock - en producción sería el ABI real)
const BIOSHIELD_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "coverageAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "premium",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "triggerConditions",
        "type": "string"
      }
    ],
    "name": "createPolicy",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "policyId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserPolicies",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "coverageAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "premium",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endDate",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "status",
            "type": "uint8"
          }
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
      {
        "internalType": "uint256",
        "name": "policyId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "evidence",
        "type": "string"
      }
    ],
    "name": "submitClaim",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "claimId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalLiquidity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "activePolicies",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalClaims",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "averageApy",
            "type": "uint256"
          }
        ],
        "internalType": "struct BioShield.PoolStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const LIVES_TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const BIOSHIELD_ADDRESS = process.env.NEXT_PUBLIC_BIOSHIELD_CONTRACT || '0x...'
const LIVES_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_LIVES_TOKEN || '0x...'

export interface Policy {
  id: number
  coverageAmount: bigint
  premium: bigint
  startDate: bigint
  endDate: bigint
  status: number
}

export interface PoolStats {
  totalLiquidity: bigint
  activePolicies: bigint
  totalClaims: bigint
  averageApy: bigint
}

export function useBioShieldContract() {
  const { address } = useAccount()
  
  const createPolicy = useWriteContract()

  const submitClaim = useWriteContract()

  const userPolicies = useReadContract({
    address: BIOSHIELD_ADDRESS as `0x${string}`,
    abi: BIOSHIELD_ABI,
    functionName: 'getUserPolicies',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  })

  const poolStats = useReadContract({
    address: BIOSHIELD_ADDRESS as `0x${string}`,
    abi: BIOSHIELD_ABI,
    functionName: 'getPoolStats',
  })

  return { 
    createPolicy, 
    submitClaim, 
    userPolicies, 
    poolStats 
  }
}

export function useLivesToken() {
  const { address } = useAccount()
  
  const { data: balance } = useBalance({
    address: address,
    token: LIVES_TOKEN_ADDRESS as `0x${string}`,
  })

  const { writeContractAsync: approve } = useWriteContract()

  const calculateDiscount = (amount: number) => amount * 0.5

  return { 
    balance, 
    approve, 
    calculateDiscount 
  }
}

export function useShieldToken() {
  const { address } = useAccount()
  
  const { data: balance } = useBalance({
    address: address,
    token: process.env.NEXT_PUBLIC_SHIELD_TOKEN as `0x${string}`,
  })

  return { balance }
}

// Utility functions for contract interactions
export class BioShieldContractService {
  private provider: ethers.Provider
  private signer: ethers.Signer
  private contract: ethers.Contract
  private livesToken: ethers.Contract

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider
    this.signer = signer
    this.contract = new ethers.Contract(BIOSHIELD_ADDRESS, BIOSHIELD_ABI, signer)
    this.livesToken = new ethers.Contract(LIVES_TOKEN_ADDRESS, LIVES_TOKEN_ABI, signer)
  }

  async createPolicy(
    coverageAmount: bigint,
    premium: bigint,
    triggerConditions: string,
    payWithLives: boolean = false
  ) {
    try {
      const discountedPremium = payWithLives ? premium / BigInt(2) : premium

      if (payWithLives) {
        // Approve LIVES token spending
        const approveTx = await this.livesToken.approve(BIOSHIELD_ADDRESS, discountedPremium)
        await approveTx.wait()
      }

      const tx = await this.contract.createPolicy(
        coverageAmount,
        discountedPremium,
        triggerConditions
      )
      
      const receipt = await tx.wait()
      const policyId = receipt.logs[0].args[0]

      return {
        success: true,
        tx: tx.hash,
        policyId: policyId.toString()
      }
    } catch (error) {
      console.error('Error creating policy:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async submitClaim(policyId: number, evidence: string) {
    try {
      const tx = await this.contract.submitClaim(policyId, evidence)
      const receipt = await tx.wait()
      const claimId = receipt.logs[0].args[0]

      return {
        success: true,
        tx: tx.hash,
        claimId: claimId.toString()
      }
    } catch (error) {
      console.error('Error submitting claim:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getUserPolicies(userAddress: string): Promise<Policy[]> {
    try {
      const policies = await this.contract.getUserPolicies(userAddress)
      return policies.map((policy: any) => ({
        id: policy.id.toNumber(),
        coverageAmount: policy.coverageAmount,
        premium: policy.premium,
        startDate: policy.startDate,
        endDate: policy.endDate,
        status: policy.status
      }))
    } catch (error) {
      console.error('Error fetching user policies:', error)
      return []
    }
  }

  async getPoolStats(): Promise<PoolStats | null> {
    try {
      const stats = await this.contract.getPoolStats()
      return {
        totalLiquidity: stats.totalLiquidity,
        activePolicies: stats.activePolicies,
        totalClaims: stats.totalClaims,
        averageApy: stats.averageApy
      }
    } catch (error) {
      console.error('Error fetching pool stats:', error)
      return null
    }
  }

  async getLivesBalance(userAddress: string): Promise<bigint> {
    try {
      return await this.livesToken.balanceOf(userAddress)
    } catch (error) {
      console.error('Error fetching LIVES balance:', error)
      return BigInt(0)
    }
  }

  async approveLives(spender: string, amount: bigint) {
    try {
      const tx = await this.livesToken.approve(spender, amount)
      await tx.wait()
      return {
        success: true,
        tx: tx.hash
      }
    } catch (error) {
      console.error('Error approving LIVES:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Bridge functionality for cross-chain operations
export class CrossChainBridge {
  private provider: ethers.Provider
  private signer: ethers.Signer

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider
    this.signer = signer
  }

  async bridgeTokens(
    fromChain: 'solana' | 'base' | 'ethereum',
    toChain: 'solana' | 'base' | 'ethereum',
    amount: bigint,
    token: 'LIVES' | 'SHIELD' | 'USDC'
  ) {
    try {
      // Mock implementation - en producción sería una integración real con Wormhole
      console.log(`Bridging ${amount} ${token} from ${fromChain} to ${toChain}`)
      
      // Simulate bridge transaction
      const bridgeTx = `0x${Math.random().toString(16).substr(2, 64)}`
      
      return {
        success: true,
        bridgeTx,
        estimatedTime: '10-15 minutes'
      }
    } catch (error) {
      console.error('Error bridging tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getBridgeStatus(bridgeTx: string) {
    try {
      // Mock implementation
      return {
        success: true,
        status: 'completed',
        completedAt: new Date()
      }
    } catch (error) {
      console.error('Error getting bridge status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
