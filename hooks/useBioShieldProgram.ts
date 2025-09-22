'use client'

import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { BIOSHIELD_PROGRAM_ID, SOLANA_RPC_ENDPOINT } from '@/lib/solana/config'
import { BioshieldInsurance } from '@/lib/solana/idl'

export function useBioShieldProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null

    return new AnchorProvider(
      connection,
      wallet as any,
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      }
    )
  }, [connection, wallet])

  const program = useMemo(() => {
    if (!provider) return null

    try {
      return new Program<BioshieldInsurance>(
        IDL,
        BIOSHIELD_PROGRAM_ID,
        provider
      )
    } catch (error) {
      console.error('Error creating program:', error)
      return null
    }
  }, [provider])

  return {
    program,
    provider,
    connection,
    wallet: wallet.publicKey,
    connected: wallet.connected,
    programId: BIOSHIELD_PROGRAM_ID,
  }
}

// IDL básico para el programa (se expandirá)
const IDL = {
  "version": "0.1.0",
  "name": "bioshield_insurance",
  "instructions": [
    {
      "name": "initializePool",
      "accounts": [
        {
          "name": "insurancePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "livesTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "shieldTokenMint",
          "isMut": false,
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
          "name": "poolParams",
          "type": {
            "defined": "PoolParams"
          }
        }
      ]
    },
    {
      "name": "createCoverage",
      "accounts": [
        {
          "name": "coverageAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insurancePool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "insured",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "livesTokenAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "poolLivesAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
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
          "name": "coverageParams",
          "type": {
            "defined": "CoverageParams"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "InsurancePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "livesTokenMint",
            "type": "publicKey"
          },
          {
            "name": "shieldTokenMint",
            "type": "publicKey"
          },
          {
            "name": "totalValueLocked",
            "type": "u64"
          },
          {
            "name": "totalCoverageAmount",
            "type": "u64"
          },
          {
            "name": "totalClaimsPaid",
            "type": "u64"
          },
          {
            "name": "poolFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "minCoverageAmount",
            "type": "u64"
          },
          {
            "name": "maxCoverageAmount",
            "type": "u64"
          },
          {
            "name": "oracleAddress",
            "type": "publicKey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PoolParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeBasisPoints",
            "type": "u16"
          },
          {
            "name": "minCoverageAmount",
            "type": "u64"
          },
          {
            "name": "maxCoverageAmount",
            "type": "u64"
          },
          {
            "name": "oracleAddress",
            "type": "publicKey"
          }
        ]
      }
    }
  ]
} as const

export type BioshieldInsurance = typeof IDL