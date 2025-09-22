'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Activity,
  Plus,
  Minus,
  Eye,
  Calculator,
  BarChart3,
  PieChart,
  Zap,
  Lock,
  Unlock
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { ShieldTokenBalance } from '@/components/web3/TokenBalance'
import { formatCurrency, formatNumber } from '@/lib/utils'

// Mock data - en producción vendría de hooks/APIs
const mockPools = [
  {
    id: 'clinical-pool',
    name: 'Clinical Trials Pool (Próspera Enhanced)',
    description: 'Pool de liquidez para seguros de ensayos clínicos con IA y Próspera Fast-Track',
    totalLiquidity: 6200000,
    apy: 18.5,
    riskLevel: 'medium',
    activePolicies: 156,
    totalClaims: 23,
    stakedAmount: 0,
    rewards: 0,
    tokenSymbol: 'SHIELD',
    color: 'from-primary to-secondary',
    prosperaAdvantage: '70% más rápido',
    aiEnhanced: true,
    network: 'Solana'
  },
  {
    id: 'funding-pool',
    name: 'Research Funding Pool (IA Enhanced)',
    description: 'Pool de liquidez para seguros de financiación con IA predictiva',
    totalLiquidity: 2800000,
    apy: 15.2,
    riskLevel: 'low',
    activePolicies: 32,
    totalClaims: 3,
    stakedAmount: 0,
    rewards: 0,
    tokenSymbol: 'SHIELD',
    color: 'from-secondary to-accent',
    network: 'Base Sepolia'
  },
  {
    id: 'ip-pool',
    name: 'IP Protection Pool (IA Enhanced)',
    description: 'Pool de liquidez para protección de propiedad intelectual con IA',
    totalLiquidity: 1200000,
    apy: 22.1,
    riskLevel: 'high',
    activePolicies: 28,
    totalClaims: 12,
    stakedAmount: 0,
    rewards: 0,
    tokenSymbol: 'SHIELD',
    color: 'from-accent to-primary',
    aiEnhanced: true,
    network: 'Optimism Sepolia'
  },
  {
    id: 'regulatory-pool',
    name: 'Regulatory Approval Pool (Próspera)',
    description: 'Pool de liquidez para aprobaciones regulatorias con Próspera Fast-Track',
    totalLiquidity: 2000000,
    apy: 25.3,
    riskLevel: 'high',
    activePolicies: 18,
    totalClaims: 5,
    stakedAmount: 0,
    rewards: 0,
    tokenSymbol: 'SHIELD',
    color: 'from-danger to-accent',
    prosperaAdvantage: '70% más rápido',
    nftIncluded: true,
    network: 'Solana'
  }
]

const mockStats = {
  totalTVL: 10240000,
  totalStakers: 1247,
  averageApy: 20.3,
  totalRewards: 285000,
  protocolRevenue: 480000,
  shieldTokenPrice: 0.85,
  prosperaAdvantage: '70%',
  aiEnhanced: true,
  hackathonWins: 2
}

export default function PoolsPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedPool, setSelectedPool] = useState<string | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: PieChart },
    { id: 'pools', name: 'Pools', icon: TrendingUp },
    { id: 'stake', name: 'Stake', icon: Lock },
    { id: 'analytics', name: 'Analíticas', icon: BarChart3 },
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success'
      case 'medium': return 'text-accent'
      case 'high': return 'text-danger'
      default: return 'text-text-secondary'
    }
  }

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success/20'
      case 'medium': return 'bg-accent/20'
      case 'high': return 'bg-danger/20'
      default: return 'bg-white/10'
    }
  }

  const calculateRewards = (amount: number, apy: number, days: number = 365) => {
    return (amount * apy / 100) * (days / 365)
  }

  const selectedPoolData = selectedPool ? mockPools.find(p => p.id === selectedPool) : null

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Liquidity Pools
            </h1>
            <p className="text-lg text-text-secondary">
              Proporciona liquidez y gana recompensas en $SHIELD tokens
            </p>
          </div>

          {/* Token Balance */}
          <div className="mb-8">
            <ShieldTokenBalance />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    selectedTab === tab.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {formatCurrency(mockStats.totalTVL)}
                  </div>
                  <div className="text-sm text-text-secondary">TVL Total</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    {mockStats.totalStakers}
                  </div>
                  <div className="text-sm text-text-secondary">Stakers</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {mockStats.averageApy}%
                  </div>
                  <div className="text-sm text-text-secondary">APY Promedio</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {formatCurrency(mockStats.totalRewards)}
                  </div>
                  <div className="text-sm text-text-secondary">Recompensas</div>
                </GlassCard>
              </div>

              {/* Top Pools */}
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">
                  Pools Principales
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {mockPools.slice(0, 4).map((pool, index) => (
                    <motion.div
                      key={pool.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <GlassCard hover className="h-full">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary">
                                {pool.name}
                              </h3>
                              <p className="text-sm text-text-secondary">
                                {pool.description}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBg(pool.riskLevel)} ${getRiskColor(pool.riskLevel)}`}>
                              {pool.riskLevel}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">TVL:</span>
                              <span className="text-text-primary font-semibold">
                                {formatCurrency(pool.totalLiquidity)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">APY:</span>
                              <span className="text-success font-semibold">
                                {pool.apy}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Pólizas:</span>
                              <span className="text-text-primary font-semibold">
                                {pool.activePolicies}
                              </span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10">
                            <GradientButton
                              size="sm"
                              fullWidth
                              onClick={() => {
                                setSelectedPool(pool.id)
                                setSelectedTab('stake')
                              }}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Stake Liquidez
                            </GradientButton>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pools Tab */}
          {selectedTab === 'pools' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Todos los Pools
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockPools.map((pool, index) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <GlassCard hover glow className="h-full">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                          <div className={`w-16 h-16 bg-gradient-to-r ${pool.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <Shield className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-text-primary mb-2">
                            {pool.name}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {pool.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary">TVL:</span>
                            <span className="text-text-primary font-semibold">
                              {formatCurrency(pool.totalLiquidity)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary">APY:</span>
                            <span className="text-success font-semibold">
                              {pool.apy}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Riesgo:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBg(pool.riskLevel)} ${getRiskColor(pool.riskLevel)}`}>
                              {pool.riskLevel}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Pólizas Activas:</span>
                            <span className="text-text-primary font-semibold">
                              {pool.activePolicies}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Claims:</span>
                            <span className="text-text-primary font-semibold">
                              {pool.totalClaims}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4 border-t border-white/10">
                          <GradientButton
                            fullWidth
                            onClick={() => {
                              setSelectedPool(pool.id)
                              setSelectedTab('stake')
                            }}
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Stake Liquidez
                          </GradientButton>
                          
                          <GradientButton
                            fullWidth
                            variant="secondary"
                            onClick={() => {
                              // Navigate to pool details
                              console.log('View pool details:', pool.id)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </GradientButton>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Stake Tab */}
          {selectedTab === 'stake' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                  Stake Liquidez
                </h2>
                {selectedPool && (
                  <div className="text-sm text-text-secondary">
                    Pool: {selectedPoolData?.name}
                  </div>
                )}
              </div>

              {!selectedPool ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Selecciona un Pool
                  </h3>
                  <p className="text-text-secondary mb-6">
                    Elige un pool de liquidez para comenzar a hacer stake
                  </p>
                  <GradientButton onClick={() => setSelectedTab('pools')}>
                    Ver Pools
                  </GradientButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Stake Form */}
                  <div className="space-y-6">
                    <GlassCard>
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <Lock className="w-6 h-6 text-primary" />
                          <h3 className="text-lg font-semibold text-text-primary">
                            Stake Tokens
                          </h3>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-text-primary mb-2">
                            Cantidad a Stake
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">
                              $SHIELD
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setStakeAmount('100')}
                            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                          >
                            100
                          </button>
                          <button
                            onClick={() => setStakeAmount('500')}
                            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                          >
                            500
                          </button>
                          <button
                            onClick={() => setStakeAmount('1000')}
                            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                          >
                            1000
                          </button>
                          <button
                            onClick={() => setStakeAmount('MAX')}
                            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                          >
                            MAX
                          </button>
                        </div>

                        <GradientButton fullWidth>
                          <Lock className="w-4 h-4 mr-2" />
                          Stake Tokens
                        </GradientButton>
                      </div>
                    </GlassCard>

                    {/* Unstake Form */}
                    <GlassCard>
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <Unlock className="w-6 h-6 text-secondary" />
                          <h3 className="text-lg font-semibold text-text-primary">
                            Unstake Tokens
                          </h3>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-text-primary mb-2">
                            Cantidad a Unstake
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={unstakeAmount}
                              onChange={(e) => setUnstakeAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">
                              $SHIELD
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-text-secondary">
                          Staked: {selectedPoolData?.stakedAmount || 0} $SHIELD
                        </div>

                        <GradientButton fullWidth variant="secondary">
                          <Unlock className="w-4 h-4 mr-2" />
                          Unstake Tokens
                        </GradientButton>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Pool Info & Calculator */}
                  <div className="space-y-6">
                    <GlassCard>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-text-primary">
                          Información del Pool
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">TVL:</span>
                            <span className="text-text-primary font-semibold">
                              {formatCurrency(selectedPoolData?.totalLiquidity || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">APY:</span>
                            <span className="text-success font-semibold">
                              {selectedPoolData?.apy}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Riesgo:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBg(selectedPoolData?.riskLevel || 'medium')} ${getRiskColor(selectedPoolData?.riskLevel || 'medium')}`}>
                              {selectedPoolData?.riskLevel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Pólizas:</span>
                            <span className="text-text-primary font-semibold">
                              {selectedPoolData?.activePolicies}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Rewards Calculator */}
                    <GlassCard>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Calculator className="w-6 h-6 text-accent" />
                          <h3 className="text-lg font-semibold text-text-primary">
                            Calculadora de Recompensas
                          </h3>
                        </div>

                        {stakeAmount && selectedPoolData && (
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Stake:</span>
                              <span className="text-text-primary font-semibold">
                                {stakeAmount} $SHIELD
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">APY:</span>
                              <span className="text-success font-semibold">
                                {selectedPoolData.apy}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Recompensas/año:</span>
                              <span className="text-accent font-semibold">
                                {formatNumber(calculateRewards(Number(stakeAmount), selectedPoolData.apy))} $SHIELD
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Recompensas/mes:</span>
                              <span className="text-accent font-semibold">
                                {formatNumber(calculateRewards(Number(stakeAmount), selectedPoolData.apy, 30))} $SHIELD
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Recompensas/día:</span>
                              <span className="text-accent font-semibold">
                                {formatNumber(calculateRewards(Number(stakeAmount), selectedPoolData.apy, 1))} $SHIELD
                              </span>
                            </div>
                          </div>
                        )}

                        {!stakeAmount && (
                          <p className="text-text-secondary text-sm">
                            Ingresa una cantidad para calcular las recompensas
                          </p>
                        )}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {selectedTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Analíticas de Pools
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Distribución de TVL
                  </h3>
                  <div className="space-y-3">
                    {mockPools.map((pool) => {
                      const percentage = (pool.totalLiquidity / mockStats.totalTVL) * 100
                      return (
                        <div key={pool.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm">{pool.name}</span>
                            <span className="text-text-primary font-semibold text-sm">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${pool.color} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Rendimiento por Pool
                  </h3>
                  <div className="space-y-3">
                    {mockPools.map((pool) => (
                      <div key={pool.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-text-primary font-semibold text-sm">
                            {pool.name}
                          </div>
                          <div className="text-text-secondary text-xs">
                            {pool.activePolicies} pólizas
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-success font-semibold">
                            {pool.apy}% APY
                          </div>
                          <div className="text-text-secondary text-xs">
                            {pool.totalClaims} claims
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
