'use client'

import { useState, useCallback, useEffect } from 'react'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useBioShieldProgram } from './useBioShieldProgram'
import { SEEDS, POOL_CONFIG } from '@/lib/solana/config'
import { PoolParams, InsurancePool, PoolMetrics } from '@/lib/solana/types'
import BN from 'bn.js'
import toast from 'react-hot-toast'

export function useInsurancePool() {
  const { program, wallet, connected } = useBioShieldProgram()
  const [loading, setLoading] = useState(false)
  const [poolData, setPoolData] = useState<InsurancePool | null>(null)
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics | null>(null)

  // Obtener la dirección del pool principal
  const getPoolAddress = useCallback(async (authority: PublicKey) => {
    if (!program) throw new Error('Program not available')

    const [poolPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SEEDS.INSURANCE_POOL),
        authority.toBuffer()
      ],
      program.programId
    )

    return poolPda
  }, [program])

  // Inicializar el pool de seguros
  const initializePool = useCallback(async (params: {
    livesTokenMint: PublicKey
    shieldTokenMint: PublicKey
    feeBasisPoints?: number
    minCoverageAmount?: BN
    maxCoverageAmount?: BN
    oracleAddress: PublicKey
  }) => {
    if (!program || !wallet) {
      throw new Error('Wallet not connected or program not available')
    }

    setLoading(true)

    try {
      const poolAddress = await getPoolAddress(wallet)

      const poolParams: PoolParams = {
        feeBasisPoints: params.feeBasisPoints || POOL_CONFIG.DEFAULT_FEE_BASIS_POINTS,
        minCoverageAmount: params.minCoverageAmount || new BN(POOL_CONFIG.MIN_COVERAGE_AMOUNT),
        maxCoverageAmount: params.maxCoverageAmount || new BN(POOL_CONFIG.MAX_COVERAGE_AMOUNT),
        oracleAddress: params.oracleAddress,
      }

      const signature = await program.methods
        .initializePool(poolParams)
        .accounts({
          insurancePool: poolAddress,
          authority: wallet,
          livesTokenMint: params.livesTokenMint,
          shieldTokenMint: params.shieldTokenMint,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      toast.success('Insurance pool initialized successfully!')

      // Actualizar datos del pool
      await fetchPoolData()

      return { signature, poolAddress }

    } catch (error: any) {
      console.error('Error initializing pool:', error)
      toast.error(`Failed to initialize pool: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, getPoolAddress])

  // Obtener datos del pool
  const fetchPoolData = useCallback(async () => {
    if (!program || !wallet) return null

    try {
      const poolAddress = await getPoolAddress(wallet)
      const poolAccount = await program.account.insurancePool.fetch(poolAddress)

      setPoolData(poolAccount as InsurancePool)
      return poolAccount as InsurancePool

    } catch (error) {
      console.error('Error fetching pool data:', error)
      return null
    }
  }, [program, wallet, getPoolAddress])

  // Calcular métricas del pool
  const calculatePoolMetrics = useCallback(async (): Promise<PoolMetrics | null> => {
    if (!poolData) return null

    try {
      // Aquí normalmente consultarías la blockchain para obtener datos reales
      // Por ahora, calculamos con los datos disponibles
      const metrics: PoolMetrics = {
        totalValueLocked: poolData.totalValueLocked.toNumber() / LAMPORTS_PER_SOL,
        activePolicies: 0, // Se calculará consultando todas las coberturas activas
        totalClaims: 0, // Se calculará consultando todos los claims
        averageApy: 12.5, // Se calculará basado en rendimientos históricos
        claimSuccessRate: 95.2, // Se calculará basado en claims históricos
        averageClaimTime: '2.4h', // Se calculará basado en tiempos de procesamiento
      }

      setPoolMetrics(metrics)
      return metrics

    } catch (error) {
      console.error('Error calculating pool metrics:', error)
      return null
    }
  }, [poolData])

  // Verificar si el pool existe
  const checkPoolExists = useCallback(async (authority?: PublicKey): Promise<boolean> => {
    if (!program) return false

    try {
      const authKey = authority || wallet
      if (!authKey) return false

      const poolAddress = await getPoolAddress(authKey)
      const poolAccount = await program.account.insurancePool.fetchNullable(poolAddress)

      return poolAccount !== null
    } catch (error) {
      console.error('Error checking pool existence:', error)
      return false
    }
  }, [program, wallet, getPoolAddress])

  // Pausar/despausar el pool (solo para authority)
  const togglePoolPause = useCallback(async (pause: boolean) => {
    if (!program || !wallet || !poolData) {
      throw new Error('Prerequisites not met')
    }

    if (!poolData.authority.equals(wallet)) {
      throw new Error('Only pool authority can pause/unpause')
    }

    setLoading(true)

    try {
      const poolAddress = await getPoolAddress(wallet)

      const methodName = pause ? 'pausePool' : 'unpausePool'
      const signature = await program.methods[methodName]()
        .accounts({
          insurancePool: poolAddress,
          authority: wallet,
        })
        .rpc()

      toast.success(`Pool ${pause ? 'paused' : 'unpaused'} successfully!`)

      // Actualizar datos del pool
      await fetchPoolData()

      return signature

    } catch (error: any) {
      console.error(`Error ${pause ? 'pausing' : 'unpausing'} pool:`, error)
      toast.error(`Failed to ${pause ? 'pause' : 'unpause'} pool: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, poolData, getPoolAddress, fetchPoolData])

  // Efectos para cargar datos automáticamente
  useEffect(() => {
    if (connected && program && wallet) {
      fetchPoolData()
    }
  }, [connected, program, wallet, fetchPoolData])

  useEffect(() => {
    if (poolData) {
      calculatePoolMetrics()
    }
  }, [poolData, calculatePoolMetrics])

  return {
    // Estado
    loading,
    poolData,
    poolMetrics,
    connected,

    // Métodos
    initializePool,
    fetchPoolData,
    calculatePoolMetrics,
    checkPoolExists,
    togglePoolPause,
    getPoolAddress,

    // Utilidades
    isPoolAuthority: poolData?.authority.equals(wallet || PublicKey.default) || false,
    isPoolPaused: poolData?.isPaused || false,
  }
}