import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { WalletContextState } from '@solana/wallet-adapter-react'

// IDL del programa BioShield (mock - en producción sería el IDL real)
const IDL = {
  "version": "0.1.0",
  "name": "bioshield_insurance",
  "instructions": [
    {
      "name": "createCoverage",
      "accounts": [
        {
          "name": "coverageAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insured",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "insurancePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "livesToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "coverageAmount",
          "type": "u64"
        },
        {
          "name": "premium",
          "type": "u64"
        },
        {
          "name": "triggerConditions",
          "type": {
            "defined": "TriggerConditions"
          }
        }
      ]
    },
    {
      "name": "processClaim",
      "accounts": [
        {
          "name": "coverageAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insured",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "insurancePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oracle",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "oracleData",
          "type": {
            "defined": "OracleData"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "CoverageAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "insured",
            "type": "publicKey"
          },
          {
            "name": "coverageAmount",
            "type": "u64"
          },
          {
            "name": "premium",
            "type": "u64"
          },
          {
            "name": "startDate",
            "type": "i64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": "CoverageStatus"
            }
          },
          {
            "name": "triggerConditions",
            "type": {
              "defined": "TriggerConditions"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CoverageStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Active"
          },
          {
            "name": "Expired"
          },
          {
            "name": "Claimed"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    },
    {
      "name": "TriggerConditions",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clinicalTrialId",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "fundingMilestone",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "ipApplicationNumber",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "regulatorySubmissionId",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "thresholdValue",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "comparisonOperator",
            "type": {
              "option": {
                "defined": "ComparisonOperator"
              }
            }
          },
          {
            "name": "dataSource",
            "type": {
              "defined": "DataSource"
            }
          }
        ]
      }
    },
    {
      "name": "OracleData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "value",
            "type": "string"
          },
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "confidence",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ComparisonOperator",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "GreaterThan"
          },
          {
            "name": "LessThan"
          },
          {
            "name": "Equals"
          }
        ]
      }
    },
    {
      "name": "DataSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ClinicalTrialsGov"
          },
          {
            "name": "FdaGov"
          },
          {
            "name": "UsptoGov"
          },
          {
            "name": "CustomApi"
          }
        ]
      }
    }
  ]
}

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'BioSh1eLd...')
const INSURANCE_POOL = new PublicKey(process.env.NEXT_PUBLIC_INSURANCE_POOL || 'InsurP00L...')
const LIVES_TOKEN = new PublicKey(process.env.NEXT_PUBLIC_LIVES_TOKEN || 'L1VES...')

export interface TriggerConditions {
  clinicalTrialId?: string
  fundingMilestone?: string
  ipApplicationNumber?: string
  regulatorySubmissionId?: string
  thresholdValue?: number
  comparisonOperator?: 'greater_than' | 'less_than' | 'equals'
  dataSource: 'clinicaltrials.gov' | 'fda.gov' | 'uspto.gov' | 'custom_api'
}

export interface OracleData {
  source: string
  timestamp: number
  value: string
  verified: boolean
  confidence: number
}

export class BioShieldProgram {
  program: Program
  connection: Connection
  wallet: WalletContextState

  constructor(connection: Connection, wallet: WalletContextState) {
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    )
    this.program = new Program(IDL as any, PROGRAM_ID, provider)
    this.connection = connection
    this.wallet = wallet
  }

  async createCoverage(
    coverageAmount: number,
    premium: number,
    triggerConditions: TriggerConditions,
    payWithLives: boolean = false
  ) {
    try {
      const discountedPremium = payWithLives ? premium * 0.5 : premium
      
      const [coveragePDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('coverage'),
          this.wallet.publicKey!.toBuffer(),
          Buffer.from(Date.now().toString())
        ],
        this.program.programId
      )

      const tx = await this.program.methods
        .createCoverage(
          new BN(coverageAmount),
          new BN(discountedPremium),
          this.mapTriggerConditions(triggerConditions)
        )
        .accounts({
          coverageAccount: coveragePDA,
          insured: this.wallet.publicKey!,
          insurancePool: INSURANCE_POOL,
          livesToken: payWithLives ? LIVES_TOKEN : undefined,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc()

      return { 
        success: true,
        tx, 
        coverageId: coveragePDA.toString() 
      }
    } catch (error) {
      console.error('Error creating coverage:', error)
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async processClaim(coverageId: string, evidence: any) {
    try {
      // Fetch oracle data
      const oracleData = await this.fetchChainlinkOracle(coverageId)
      
      const tx = await this.program.methods
        .processClaim(this.mapOracleData(oracleData))
        .accounts({
          coverageAccount: new PublicKey(coverageId),
          insured: this.wallet.publicKey!,
          insurancePool: INSURANCE_POOL,
          oracle: new PublicKey(process.env.CHAINLINK_ORACLE_ADDRESS || '0x...'),
        })
        .rpc()

      return { 
        success: true,
        tx 
      }
    } catch (error) {
      console.error('Error processing claim:', error)
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getActivePolicies(userAddress: string) {
    try {
      const policies = await this.program.account.coverageAccount.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: userAddress,
          },
        },
      ])
      return { 
        success: true,
        policies: policies.map(p => this.mapCoverageAccount(p.account, p.publicKey))
      }
    } catch (error) {
      console.error('Error fetching policies:', error)
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        policies: []
      }
    }
  }

  async getPoolStats() {
    try {
      // Mock implementation - en producción sería una llamada real al programa
      return {
        success: true,
        stats: {
          totalLiquidity: 2400000,
          activePolicies: 156,
          totalClaims: 23,
          averageApy: 12.5
        }
      }
    } catch (error) {
      console.error('Error fetching pool stats:', error)
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async fetchChainlinkOracle(coverageId: string): Promise<OracleData> {
    // Mock implementation - en producción sería una llamada real a Chainlink
    return {
      source: 'ClinicalTrials.gov',
      timestamp: Date.now(),
      value: 'TERMINATED',
      verified: true,
      confidence: 95
    }
  }

  private mapTriggerConditions(conditions: TriggerConditions) {
    return {
      clinicalTrialId: conditions.clinicalTrialId || null,
      fundingMilestone: conditions.fundingMilestone || null,
      ipApplicationNumber: conditions.ipApplicationNumber || null,
      regulatorySubmissionId: conditions.regulatorySubmissionId || null,
      thresholdValue: conditions.thresholdValue || null,
      comparisonOperator: conditions.comparisonOperator ? {
        [conditions.comparisonOperator]: {}
      } : null,
      dataSource: {
        [conditions.dataSource.replace('.', '').toUpperCase()]: {}
      }
    }
  }

  private mapOracleData(data: OracleData) {
    return {
      source: data.source,
      timestamp: new BN(data.timestamp),
      value: data.value,
      verified: data.verified,
      confidence: data.confidence
    }
  }

  private mapCoverageAccount(account: any, publicKey: PublicKey) {
    return {
      id: publicKey.toString(),
      insured: account.insured.toString(),
      coverageAmount: account.coverageAmount.toNumber(),
      premium: account.premium.toNumber(),
      startDate: new Date(account.startDate.toNumber() * 1000),
      endDate: new Date(account.endDate.toNumber() * 1000),
      status: this.mapCoverageStatus(account.status),
      triggerConditions: this.mapTriggerConditionsFromAccount(account.triggerConditions)
    }
  }

  private mapCoverageStatus(status: any): 'active' | 'expired' | 'claimed' | 'cancelled' {
    if (status.active) return 'active'
    if (status.expired) return 'expired'
    if (status.claimed) return 'claimed'
    if (status.cancelled) return 'cancelled'
    return 'active'
  }

  private mapTriggerConditionsFromAccount(conditions: any): TriggerConditions {
    return {
      clinicalTrialId: conditions.clinicalTrialId,
      fundingMilestone: conditions.fundingMilestone,
      ipApplicationNumber: conditions.ipApplicationNumber,
      regulatorySubmissionId: conditions.regulatorySubmissionId,
      thresholdValue: conditions.thresholdValue?.toNumber(),
      comparisonOperator: this.mapComparisonOperator(conditions.comparisonOperator),
      dataSource: this.mapDataSource(conditions.dataSource)
    }
  }

  private mapComparisonOperator(operator: any): 'greater_than' | 'less_than' | 'equals' | undefined {
    if (operator?.greaterThan) return 'greater_than'
    if (operator?.lessThan) return 'less_than'
    if (operator?.equals) return 'equals'
    return undefined
  }

  private mapDataSource(source: any): 'clinicaltrials.gov' | 'fda.gov' | 'uspto.gov' | 'custom_api' {
    if (source?.clinicaltrialsgov) return 'clinicaltrials.gov'
    if (source?.fdagov) return 'fda.gov'
    if (source?.usptogov) return 'uspto.gov'
    if (source?.customapi) return 'custom_api'
    return 'custom_api'
  }
}
