'use client'

import { useState, useCallback, useEffect } from 'react'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { useBioShieldProgram } from './useBioShieldProgram'
import { useInsurancePool } from './useInsurancePool'
import BN from 'bn.js'
import toast from 'react-hot-toast'

interface LiquidityProvider {
  address: PublicKey
  totalProvided: BN
  shieldTokensOwned: BN
  joinedAt: number
  lastReward: BN
}

interface LiquidityMetrics {
  totalLiquidity: BN
  apr: number
  utilizationRate: number
  totalProviders: number
  yourShare: number
  pendingRewards: BN
}

export function useLiquidity() {
  const { program, wallet, connected } = useBioShieldProgram()
  const { poolData, getPoolAddress } = useInsurancePool()
  const [loading, setLoading] = useState(false)
  const [liquidityMetrics, setLiquidityMetrics] = useState<LiquidityMetrics | null>(null)
  const [userLiquidityInfo, setUserLiquidityInfo] = useState<LiquidityProvider | null>(null)

  // Calcular cantidad de SHIELD tokens a recibir
  const calculateShieldTokens = useCallback((
    liquidityAmount: BN,
    currentTVL: BN,
    currentShieldSupply: BN
  ): BN => {
    if (currentTVL.isZero()) {
      // Primera vez que se añade liquidez - ratio 1:1
      return liquidityAmount
    }

    // Calcular proporcionalmente: (amount / TVL) * supply
    return liquidityAmount.mul(currentShieldSupply).div(currentTVL)
  }, [])

  // Añadir liquidez al pool
  const addLiquidity = useCallback(async (params: {
    amount: BN
    tokenMint: PublicKey
    useSOL?: boolean
  }) => {
    if (!program || !wallet || !poolData) {
      throw new Error('Prerequisites not met')
    }

    if (params.amount.lte(new BN(0))) {
      throw new Error('Amount must be positive')
    }

    setLoading(true)

    try {
      const poolAddress = await getPoolAddress(poolData.authority)

      // Calcular SHIELD tokens que recibirá
      const shieldAmount = calculateShieldTokens(
        params.amount,
        poolData.totalValueLocked,
        new BN(1000000 * LAMPORTS_PER_SOL) // Mock supply, en producción sería el supply real
      )

      let liquidityProviderToken: PublicKey
      let poolTokenAccount: PublicKey
      let providerShieldAccount: PublicKey

      if (params.useSOL) {
        // Para SOL, usar wrapped SOL o manejar directamente
        throw new Error('SOL liquidity not implemented yet')
      } else {
        // Para tokens SPL
        liquidityProviderToken = await getAssociatedTokenAddress(
          params.tokenMint,
          wallet
        )

        poolTokenAccount = await getAssociatedTokenAddress(
          params.tokenMint,
          poolAddress,
          true // allowOwnerOffCurve
        )

        providerShieldAccount = await getAssociatedTokenAddress(
          poolData.shieldTokenMint,
          wallet
        )
      }

      const signature = await program.methods
        .addLiquidity(params.amount)
        .accounts({
          insurancePool: poolAddress,
          liquidityProvider: wallet,
          liquidityProviderToken,
          poolTokenAccount,
          shieldTokenMint: poolData.shieldTokenMint,
          providerShieldAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      toast.success(`Added ${params.amount.toNumber() / LAMPORTS_PER_SOL} tokens liquidity!`)

      // Actualizar métricas
      await fetchLiquidityMetrics()
      await fetchUserLiquidityInfo()

      return { signature, shieldAmount }

    } catch (error: any) {
      console.error('Error adding liquidity:', error)
      toast.error(`Failed to add liquidity: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, poolData, getPoolAddress, calculateShieldTokens])

  // Remover liquidez del pool
  const removeLiquidity = useCallback(async (params: {
    shieldTokenAmount: BN
    tokenMint: PublicKey
  }) => {
    if (!program || !wallet || !poolData) {
      throw new Error('Prerequisites not met')
    }

    setLoading(true)

    try {
      const poolAddress = await getPoolAddress(poolData.authority)

      const providerShieldAccount = await getAssociatedTokenAddress(
        poolData.shieldTokenMint,
        wallet
      )

      const poolTokenAccount = await getAssociatedTokenAddress(
        params.tokenMint,
        poolAddress,
        true
      )

      const liquidityProviderToken = await getAssociatedTokenAddress(
        params.tokenMint,
        wallet
      )

      const signature = await program.methods
        .removeLiquidity(params.shieldTokenAmount)
        .accounts({
          insurancePool: poolAddress,
          liquidityProvider: wallet,
          providerShieldAccount,
          shieldTokenMint: poolData.shieldTokenMint,
          poolTokenAccount,
          liquidityProviderToken,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()

      toast.success('Liquidity removed successfully!')

      // Actualizar métricas
      await fetchLiquidityMetrics()
      await fetchUserLiquidityInfo()

      return signature

    } catch (error: any) {
      console.error('Error removing liquidity:', error)
      toast.error(`Failed to remove liquidity: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, poolData, getPoolAddress])

  // Obtener métricas de liquidez
  const fetchLiquidityMetrics = useCallback(async (): Promise<LiquidityMetrics | null> => {
    if (!poolData) return null

    try {
      // En una implementación real, estas métricas vendrían de la blockchain
      const metrics: LiquidityMetrics = {
        totalLiquidity: poolData.totalValueLocked,
        apr: 15.5, // Se calcularía basado en fees generados
        utilizationRate: poolData.totalCoverageAmount.toNumber() / poolData.totalValueLocked.toNumber() * 100,
        totalProviders: 45, // Se contaría dinámicamente
        yourShare: userLiquidityInfo ?
          userLiquidityInfo.totalProvided.toNumber() / poolData.totalValueLocked.toNumber() * 100 : 0,
        pendingRewards: new BN(150 * LAMPORTS_PER_SOL / 1000), // Mock rewards
      }

      setLiquidityMetrics(metrics)
      return metrics

    } catch (error) {
      console.error('Error fetching liquidity metrics:', error)
      return null
    }
  }, [poolData, userLiquidityInfo])

  // Obtener información de liquidez del usuario
  const fetchUserLiquidityInfo = useCallback(async (): Promise<LiquidityProvider | null> => {
    if (!program || !wallet || !poolData) return null

    try {
      // Mock data - en producción vendría de accounts específicas
      const userInfo: LiquidityProvider = {
        address: wallet,
        totalProvided: new BN(5000 * LAMPORTS_PER_SOL),
        shieldTokensOwned: new BN(4800 * LAMPORTS_PER_SOL),
        joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 días atrás
        lastReward: new BN(25 * LAMPORTS_PER_SOL / 1000),
      }

      setUserLiquidityInfo(userInfo)
      return userInfo

    } catch (error) {
      console.error('Error fetching user liquidity info:', error)
      return null
    }
  }, [program, wallet, poolData])

  // Reclamar recompensas acumuladas
  const claimRewards = useCallback(async () => {
    if (!program || !wallet || !poolData || !userLiquidityInfo) {
      throw new Error('Prerequisites not met')
    }

    setLoading(true)

    try {
      // Mock implementation - en producción habría una función específica
      toast.success(`Claimed ${userLiquidityInfo.lastReward.toNumber() / LAMPORTS_PER_SOL} SOL in rewards!`)

      // Actualizar información del usuario
      await fetchUserLiquidityInfo()
      await fetchLiquidityMetrics()

      return 'mock-signature'

    } catch (error: any) {
      console.error('Error claiming rewards:', error)
      toast.error(`Failed to claim rewards: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [program, wallet, poolData, userLiquidityInfo, fetchUserLiquidityInfo, fetchLiquidityMetrics])

  // Calcular APR basado en fees y utilización
  const calculateCurrentAPR = useCallback((): number => {
    if (!poolData || !liquidityMetrics) return 0

    const utilizationRate = liquidityMetrics.utilizationRate / 100
    const baseAPR = 8 // APR base del 8%
    const utilizationMultiplier = 1 + (utilizationRate * 0.5) // Hasta 50% adicional

    return baseAPR * utilizationMultiplier
  }, [poolData, liquidityMetrics])

  // Calcular valor en USD de la liquidez (mock)
  const calculateLiquidityValueUSD = useCallback((amount: BN): number => {
    // Mock price: 1 SOL = $100
    const solPrice = 100
    return (amount.toNumber() / LAMPORTS_PER_SOL) * solPrice
  }, [])

  // Verificar si el usuario puede remover liquidez
  const canRemoveLiquidity = useCallback((): boolean => {
    if (!userLiquidityInfo || !poolData) return false

    // Verificar que el pool no esté paused
    if (poolData.isPaused) return false

    // Verificar que tenga SHIELD tokens
    return userLiquidityInfo.shieldTokensOwned.gt(new BN(0))
  }, [userLiquidityInfo, poolData])

  // Efectos para cargar datos automáticamente
  useEffect(() => {
    if (connected && program && wallet && poolData) {
      fetchLiquidityMetrics()
      fetchUserLiquidityInfo()
    }
  }, [connected, program, wallet, poolData, fetchLiquidityMetrics, fetchUserLiquidityInfo])

  return {
    // Estado
    loading,
    liquidityMetrics,
    userLiquidityInfo,
    connected,

    // Métodos principales
    addLiquidity,
    removeLiquidity,
    claimRewards,
    fetchLiquidityMetrics,
    fetchUserLiquidityInfo,

    // Calculadoras y utilidades
    calculateShieldTokens,
    calculateCurrentAPR,
    calculateLiquidityValueUSD,
    canRemoveLiquidity,

    // Estadísticas computadas
    userSharePercentage: liquidityMetrics?.yourShare || 0,
    estimatedAPR: calculateCurrentAPR(),
    isLiquidityProvider: userLiquidityInfo?.totalProvided.gt(new BN(0)) || false,
  }
}