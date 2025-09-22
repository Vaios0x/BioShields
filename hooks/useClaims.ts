'use client'

import { useState, useCallback, useEffect } from 'react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { useBioShieldProgram } from './useBioShieldProgram'
import { useCoverage } from './useCoverage'
import { SEEDS } from '@/lib/solana/config'
import { ClaimData, ClaimAccount, ClaimType, ClaimStatus, CoverageAccount, MultiOracleData } from '@/lib/solana/types'
import BN from 'bn.js'
import toast from 'react-hot-toast'

export function useClaims() {
  const { program, wallet, connected } = useBioShieldProgram()
  const { userCoverages } = useCoverage()
  const [loading, setLoading] = useState(false)
  const [userClaims, setUserClaims] = useState<ClaimAccount[]>([])

  // Obtener dirección de claim para una cobertura específica
  const getClaimAddress = useCallback(async (
    coverage: PublicKey,
    claimIndex: number = 0
  ) => {
    if (!program) throw new Error('Program not available')

    const [claimPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SEEDS.CLAIM_ACCOUNT),
        coverage.toBuffer(),
        new BN(claimIndex).toArrayLike(Buffer, 'le', 8)
      ],
      program.programId
    )

    return claimPda
  }, [program])

  // Presentar un nuevo claim
  const submitClaim = useCallback(async (params: {
    coverageAddress: PublicKey
    claimAmount: BN
    claimType: ClaimType
    evidence: string // URI o hash de evidencia
    description?: string
  }) => {
    if (!program || !wallet) {
      throw new Error('Prerequisites not met')
    }

    setLoading(true)

    try {
      // Validar que la cobertura existe y está activa
      const coverageAccount = await program.account.coverageAccount.fetch(params.coverageAddress)

      if (!coverageAccount.insured.equals(wallet)) {
        throw new Error('Only the insured can submit claims')
      }

      if (coverageAccount.status !== 'Active') {
        throw new Error('Coverage is not active')
      }

      // Verificar que no haya excedido el monto de cobertura
      const remainingCoverage = coverageAccount.coverageAmount.sub(coverageAccount.totalClaimed)
      if (params.claimAmount.gt(remainingCoverage)) {
        throw new Error('Claim amount exceeds remaining coverage')
      }

      // Crear hash de evidencia (simulado - en producción usarías IPFS o similar)
      const evidenceHash = Array.from(
        Buffer.from(params.evidence.slice(0, 32).padEnd(32, '0'), 'utf8')
      )

      // Obtener siguiente índice de claim para esta cobertura
      const claimIndex = coverageAccount.claimsMade // Usar claims existentes como índice

      const claimAddress = await getClaimAddress(params.coverageAddress, claimIndex)

      const claimData: ClaimData = {
        amount: params.claimAmount,
        claimType: params.claimType,
        evidenceHash,
      }

      const signature = await program.methods
        .submitClaim(claimData)
        .accounts({
          claimAccount: claimAddress,
          coverageAccount: params.coverageAddress,
          claimant: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      toast.success('Claim submitted successfully!')

      // Actualizar lista de claims del usuario
      await fetchUserClaims()

      return { signature, claimAddress }

    } catch (error: any) {
      console.error('Error submitting claim:', error)
      toast.error(`Failed to submit claim: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, getClaimAddress])

  // Procesar claim con oráculos (solo para procesadores autorizados)
  const processClaimWithOracle = useCallback(async (params: {
    claimAddress: PublicKey
    coverageAddress: PublicKey
    oracleData: MultiOracleData
  }) => {
    if (!program || !wallet) {
      throw new Error('Prerequisites not met')
    }

    setLoading(true)

    try {
      const signature = await program.methods
        .processClaimWithOracle(params.oracleData)
        .accounts({
          claimAccount: params.claimAddress,
          coverageAccount: params.coverageAddress,
          insurancePool: await getPoolAddress(), // Necesitarías implementar esto
          processor: wallet,
          claimantTokenAccount: null, // Se determinaría dinámicamente
          poolTokenAccount: null, // Se determinaría dinámicamente
          tokenProgram: null, // TOKEN_PROGRAM_ID si es necesario
        })
        .rpc()

      toast.success('Claim processed successfully!')

      // Actualizar datos
      await fetchUserClaims()

      return signature

    } catch (error: any) {
      console.error('Error processing claim:', error)
      toast.error(`Failed to process claim: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet])

  // Obtener claims del usuario
  const fetchUserClaims = useCallback(async (userPublicKey?: PublicKey) => {
    if (!program) return []

    const targetUser = userPublicKey || wallet
    if (!targetUser) return []

    try {
      const claims: ClaimAccount[] = []

      // Obtener todas las coberturas del usuario primero
      const userCoveragesList = userCoverages.length > 0 ? userCoverages : await fetchUserCoverages?.(targetUser) || []

      // Para cada cobertura, buscar sus claims
      for (const coverage of userCoveragesList) {
        const coverageAddress = new PublicKey(coverage.key || coverage.publicKey || coverage.address)

        // Buscar claims para esta cobertura
        for (let i = 0; i < coverage.claimsMade; i++) {
          try {
            const claimAddress = await getClaimAddress(coverageAddress, i)
            const claimAccount = await program.account.claimAccount.fetch(claimAddress)

            if (claimAccount) {
              claims.push({
                ...claimAccount,
                address: claimAddress,
              } as ClaimAccount)
            }
          } catch (error) {
            // Si no se encuentra el claim, continuar
            continue
          }
        }
      }

      if (targetUser.equals(wallet || PublicKey.default)) {
        setUserClaims(claims)
      }

      return claims

    } catch (error) {
      console.error('Error fetching user claims:', error)
      return []
    }
  }, [program, wallet, userCoverages, getClaimAddress])

  // Obtener un claim específico
  const fetchClaim = useCallback(async (claimAddress: PublicKey): Promise<ClaimAccount | null> => {
    if (!program) return null

    try {
      const claimAccount = await program.account.claimAccount.fetch(claimAddress)
      return claimAccount as ClaimAccount
    } catch (error) {
      console.error('Error fetching claim:', error)
      return null
    }
  }, [program])

  // Verificar si un claim está pendiente
  const isClaimPending = useCallback((claim: ClaimAccount): boolean => {
    return claim.status === ClaimStatus.Pending || claim.status === ClaimStatus.UnderReview
  }, [])

  // Obtener claims por estado
  const getClaimsByStatus = useCallback((status: ClaimStatus): ClaimAccount[] => {
    return userClaims.filter(claim => claim.status === status)
  }, [userClaims])

  // Calcular total reclamado por el usuario
  const getTotalClaimedAmount = useCallback((): BN => {
    return userClaims.reduce((total, claim) => {
      if (claim.status === ClaimStatus.Approved || claim.status === ClaimStatus.Paid) {
        return total.add(claim.claimAmount)
      }
      return total
    }, new BN(0))
  }, [userClaims])

  // Obtener tiempo promedio de procesamiento
  const getAverageProcessingTime = useCallback((): number => {
    const processedClaims = userClaims.filter(claim =>
      claim.processedAt && claim.submittedAt &&
      (claim.status === ClaimStatus.Approved || claim.status === ClaimStatus.Rejected)
    )

    if (processedClaims.length === 0) return 0

    const totalTime = processedClaims.reduce((sum, claim) => {
      const processingTime = claim.processedAt!.toNumber() - claim.submittedAt.toNumber()
      return sum + processingTime
    }, 0)

    return totalTime / processedClaims.length
  }, [userClaims])

  // Simular datos de oracle para testing
  const createMockOracleData = useCallback((shouldApprove: boolean = true): MultiOracleData => {
    return {
      requestId: Array.from(Buffer.from('mock_request_' + Date.now().toString(), 'utf8').slice(0, 32)),
      timestamp: new BN(Math.floor(Date.now() / 1000)),
      dataPoints: [
        {
          dataType: {
            clinicalTrialResult: { success: !shouldApprove } // Invertir para simular fallo
          },
          value: new BN(shouldApprove ? 1 : 0),
          source: 'ClinicalTrials.gov'
        },
        {
          dataType: {
            regulatoryDecision: { approved: shouldApprove }
          },
          value: new BN(shouldApprove ? 1 : 0),
          source: 'FDA Database'
        }
      ],
      signatures: [
        Array.from(Buffer.alloc(64, 1)), // Mock signature 1
        Array.from(Buffer.alloc(64, 2)), // Mock signature 2
      ],
      consensus: true
    }
  }, [])

  // Efectos para cargar datos automáticamente
  useEffect(() => {
    if (connected && program && wallet) {
      fetchUserClaims()
    }
  }, [connected, program, wallet, fetchUserClaims])

  return {
    // Estado
    loading,
    userClaims,
    connected,

    // Métodos principales
    submitClaim,
    processClaimWithOracle,
    fetchUserClaims,
    fetchClaim,
    getClaimAddress,

    // Utilidades
    isClaimPending,
    getClaimsByStatus,
    getTotalClaimedAmount,
    getAverageProcessingTime,
    createMockOracleData,

    // Estadísticas
    pendingClaimsCount: getClaimsByStatus(ClaimStatus.Pending).length,
    approvedClaimsCount: getClaimsByStatus(ClaimStatus.Approved).length,
    totalClaimedAmount: getTotalClaimedAmount(),
    averageProcessingTime: getAverageProcessingTime(),
  }
}