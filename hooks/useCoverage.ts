'use client'

import { useState, useCallback, useEffect } from 'react'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { useBioShieldProgram } from './useBioShieldProgram'
import { useInsurancePool } from './useInsurancePool'
import { SEEDS, POOL_CONFIG } from '@/lib/solana/config'
import { CoverageParams, CoverageAccount, CoverageType, RiskCategory, TriggerConditions } from '@/lib/solana/types'
import BN from 'bn.js'
import toast from 'react-hot-toast'

export function useCoverage() {
  const { program, wallet, connected } = useBioShieldProgram()
  const { poolData, getPoolAddress } = useInsurancePool()
  const [loading, setLoading] = useState(false)
  const [userCoverages, setUserCoverages] = useState<CoverageAccount[]>([])

  // Obtener dirección de coverage para un usuario específico
  const getCoverageAddress = useCallback(async (
    insured: PublicKey,
    coverageIndex: number = 0
  ) => {
    if (!program) throw new Error('Program not available')

    const [coveragePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SEEDS.COVERAGE_ACCOUNT),
        insured.toBuffer(),
        new BN(coverageIndex).toArrayLike(Buffer, 'le', 8)
      ],
      program.programId
    )

    return coveragePda
  }, [program])

  // Calcular prima de seguro
  const calculatePremium = useCallback((
    coverageAmount: BN,
    coveragePeriod: number,
    riskCategory: RiskCategory,
    useTokenDiscount: boolean = false
  ): BN => {
    // Fórmula básica de cálculo de prima
    // Prima = Monto * Factor_Riesgo * Factor_Tiempo * Factor_Base

    const riskMultipliers = {
      [RiskCategory.Low]: 0.005, // 0.5%
      [RiskCategory.Medium]: 0.015, // 1.5%
      [RiskCategory.High]: 0.035, // 3.5%
      [RiskCategory.VeryHigh]: 0.065, // 6.5%
    }

    const timeMultiplier = coveragePeriod / (365 * 24 * 60 * 60) // Factor por año
    const riskMultiplier = riskMultipliers[riskCategory]

    let premium = coverageAmount
      .mul(new BN(Math.floor(riskMultiplier * 10000))) // Multiplicamos por 10000 para precisión
      .div(new BN(10000))
      .mul(new BN(Math.floor(timeMultiplier * 100)))
      .div(new BN(100))

    // Aplicar descuento del 50% si usa tokens LIVES
    if (useTokenDiscount) {
      premium = premium.div(new BN(2))
    }

    return premium
  }, [])

  // Crear nueva cobertura de seguro
  const createCoverage = useCallback(async (params: {
    coverageAmount: BN
    coveragePeriod: number
    coverageType: CoverageType
    riskCategory: RiskCategory
    triggerConditions: TriggerConditions
    metadataUri: string
    useTokenPayment?: boolean
    livesTokenMint?: PublicKey
  }) => {
    if (!program || !wallet || !poolData) {
      throw new Error('Prerequisites not met')
    }

    setLoading(true)

    try {
      // Validar parámetros
      if (params.coverageAmount.lt(new BN(POOL_CONFIG.MIN_COVERAGE_AMOUNT))) {
        throw new Error(`Coverage amount must be at least ${POOL_CONFIG.MIN_COVERAGE_AMOUNT / LAMPORTS_PER_SOL} SOL`)
      }

      if (params.coverageAmount.gt(new BN(POOL_CONFIG.MAX_COVERAGE_AMOUNT))) {
        throw new Error(`Coverage amount cannot exceed ${POOL_CONFIG.MAX_COVERAGE_AMOUNT / LAMPORTS_PER_SOL} SOL`)
      }

      // Calcular prima
      const premium = calculatePremium(
        params.coverageAmount,
        params.coveragePeriod,
        params.riskCategory,
        params.useTokenPayment
      )

      // Obtener direcciones necesarias
      const poolAddress = await getPoolAddress(poolData.authority)
      const coverageIndex = userCoverages.length // Usar índice actual para nuevo coverage
      const coverageAddress = await getCoverageAddress(wallet, coverageIndex)

      const coverageParams: CoverageParams = {
        coverageAmount: params.coverageAmount,
        coveragePeriod: params.coveragePeriod,
        coverageType: params.coverageType,
        triggerConditions: params.triggerConditions,
        riskCategory: params.riskCategory,
        metadataUri: params.metadataUri,
      }

      let livesTokenAccount = null
      let poolLivesAccount = null

      // Si usa tokens LIVES para pagar
      if (params.useTokenPayment && params.livesTokenMint) {
        livesTokenAccount = await getAssociatedTokenAddress(
          params.livesTokenMint,
          wallet
        )

        poolLivesAccount = await getAssociatedTokenAddress(
          params.livesTokenMint,
          poolAddress,
          true // allowOwnerOffCurve
        )
      }

      const accounts: any = {
        coverageAccount: coverageAddress,
        insurancePool: poolAddress,
        insured: wallet,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }

      if (livesTokenAccount && poolLivesAccount) {
        accounts.livesTokenAccount = livesTokenAccount
        accounts.poolLivesAccount = poolLivesAccount
      }

      const signature = await program.methods
        .createCoverage(coverageParams)
        .accounts(accounts)
        .rpc()

      toast.success('Coverage created successfully!')

      // Actualizar lista de coberturas del usuario
      await fetchUserCoverages()

      return { signature, coverageAddress, premium }

    } catch (error: any) {
      console.error('Error creating coverage:', error)
      toast.error(`Failed to create coverage: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, poolData, calculatePremium, getPoolAddress, getCoverageAddress, userCoverages.length])

  // Obtener coberturas del usuario
  const fetchUserCoverages = useCallback(async (userPublicKey?: PublicKey) => {
    if (!program) return []

    const targetUser = userPublicKey || wallet
    if (!targetUser) return []

    try {
      // Buscar todas las coberturas del usuario
      // En una implementación completa, esto sería más eficiente con indexing
      const coverages: CoverageAccount[] = []

      // Intentar obtener coberturas con diferentes índices
      for (let i = 0; i < 100; i++) { // Límite arbitrario
        try {
          const coverageAddress = await getCoverageAddress(targetUser, i)
          const coverageAccount = await program.account.coverageAccount.fetch(coverageAddress)

          if (coverageAccount) {
            coverages.push(coverageAccount as CoverageAccount)
          }
        } catch (error) {
          // Si no existe esta cobertura, probablemente no hay más
          break
        }
      }

      if (targetUser.equals(wallet || PublicKey.default)) {
        setUserCoverages(coverages)
      }

      return coverages

    } catch (error) {
      console.error('Error fetching user coverages:', error)
      return []
    }
  }, [program, wallet, getCoverageAddress])

  // Obtener una cobertura específica
  const fetchCoverage = useCallback(async (coverageAddress: PublicKey): Promise<CoverageAccount | null> => {
    if (!program) return null

    try {
      const coverageAccount = await program.account.coverageAccount.fetch(coverageAddress)
      return coverageAccount as CoverageAccount
    } catch (error) {
      console.error('Error fetching coverage:', error)
      return null
    }
  }, [program])

  // Verificar si una cobertura está activa
  const isCoverageActive = useCallback((coverage: CoverageAccount): boolean => {
    const currentTime = Math.floor(Date.now() / 1000)
    return (
      coverage.status === 'Active' &&
      coverage.endTime.toNumber() > currentTime &&
      coverage.totalClaimed.lt(coverage.coverageAmount)
    )
  }, [])

  // Obtener coberturas activas del usuario
  const getActiveCoverages = useCallback((): CoverageAccount[] => {
    return userCoverages.filter(isCoverageActive)
  }, [userCoverages, isCoverageActive])

  // Obtener valor total asegurado del usuario
  const getTotalCoverageValue = useCallback((): BN => {
    return userCoverages.reduce((total, coverage) => {
      if (isCoverageActive(coverage)) {
        return total.add(coverage.coverageAmount.sub(coverage.totalClaimed))
      }
      return total
    }, new BN(0))
  }, [userCoverages, isCoverageActive])

  // Efectos para cargar datos automáticamente
  useEffect(() => {
    if (connected && program && wallet) {
      fetchUserCoverages()
    }
  }, [connected, program, wallet, fetchUserCoverages])

  return {
    // Estado
    loading,
    userCoverages,
    connected,

    // Métodos principales
    createCoverage,
    fetchUserCoverages,
    fetchCoverage,
    calculatePremium,
    getCoverageAddress,

    // Utilidades
    isCoverageActive,
    getActiveCoverages,
    getTotalCoverageValue,

    // Estadísticas
    activeCoveragesCount: getActiveCoverages().length,
    totalCoverageValue: getTotalCoverageValue(),
  }
}