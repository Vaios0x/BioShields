'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Users, 
  DollarSign,
  BarChart3,
  PieChart,
  Zap,
  Star,
  Trophy,
  Activity,
  Eye,
  Plus,
  Minus
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PredictionMarket {
  id: string
  title: string
  description: string
  category: 'clinical_trial' | 'regulatory' | 'funding' | 'ip'
  status: 'active' | 'resolved' | 'cancelled'
  endDate: Date
  totalLiquidity: number
  yesPrice: number
  noPrice: number
  volume24h: number
  participants: number
  creator: string
  outcome?: 'yes' | 'no'
  resolutionDate?: Date
}

interface UserPosition {
  marketId: string
  side: 'yes' | 'no'
  amount: number
  shares: number
  avgPrice: number
  pnl: number
}

export default function PredictionPage() {
  const [selectedTab, setSelectedTab] = useState('markets')
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes')
  const [userPositions, setUserPositions] = useState<UserPosition[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Mock prediction markets
  const predictionMarkets: PredictionMarket[] = [
    {
      id: 'PM-001',
      title: '¿Aprobará la FDA el medicamento XYZ para Alzheimer en 2024?',
      description: 'Predicción sobre la aprobación del medicamento experimental XYZ para el tratamiento del Alzheimer por parte de la FDA antes del 31 de diciembre de 2024.',
      category: 'regulatory',
      status: 'active',
      endDate: new Date('2024-12-31'),
      totalLiquidity: 2500000,
      yesPrice: 0.65,
      noPrice: 0.35,
      volume24h: 125000,
      participants: 1247,
      creator: '0x1234...5678'
    },
    {
      id: 'PM-002',
      title: '¿Alcanzará el ensayo clínico Fase II de ABC su endpoint primario?',
      description: 'Predicción sobre si el ensayo clínico Fase II del medicamento ABC alcanzará su endpoint primario de eficacia con significancia estadística.',
      category: 'clinical_trial',
      status: 'active',
      endDate: new Date('2024-11-15'),
      totalLiquidity: 1800000,
      yesPrice: 0.42,
      noPrice: 0.58,
      volume24h: 89000,
      participants: 892,
      creator: '0x9876...5432'
    },
    {
      id: 'PM-003',
      title: '¿Recibirá la startup DEF financiación Serie A en Q4 2024?',
      description: 'Predicción sobre si la startup biotech DEF recibirá financiación Serie A de al menos $10M en el Q4 de 2024.',
      category: 'funding',
      status: 'active',
      endDate: new Date('2024-12-31'),
      totalLiquidity: 950000,
      yesPrice: 0.78,
      noPrice: 0.22,
      volume24h: 45000,
      participants: 456,
      creator: '0x5555...7777'
    },
    {
      id: 'PM-004',
      title: '¿Será aprobada la patente GHI por la USPTO?',
      description: 'Predicción sobre si la patente GHI relacionada con terapia génica será aprobada por la USPTO en 2024.',
      category: 'ip',
      status: 'resolved',
      endDate: new Date('2024-08-15'),
      totalLiquidity: 750000,
      yesPrice: 0.85,
      noPrice: 0.15,
      volume24h: 0,
      participants: 623,
      creator: '0x3333...9999',
      outcome: 'yes',
      resolutionDate: new Date('2024-08-20')
    }
  ]

  const tabs = [
    { id: 'markets', name: 'Mercados', icon: BarChart3 },
    { id: 'positions', name: 'Mis Posiciones', icon: Target },
    { id: 'leaderboard', name: 'Ranking', icon: Trophy },
    { id: 'create', name: 'Crear Mercado', icon: Plus },
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'clinical_trial': return 'text-primary'
      case 'regulatory': return 'text-secondary'
      case 'funding': return 'text-accent'
      case 'ip': return 'text-success'
      default: return 'text-text-secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'clinical_trial': return Activity
      case 'regulatory': return Star
      case 'funding': return DollarSign
      case 'ip': return Target
      default: return BarChart3
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success'
      case 'resolved': return 'text-primary'
      case 'cancelled': return 'text-danger'
      default: return 'text-text-secondary'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20'
      case 'resolved': return 'bg-primary/20'
      case 'cancelled': return 'bg-danger/20'
      default: return 'bg-white/10'
    }
  }

  const placeBet = async (marketId: string, side: 'yes' | 'no', amount: number) => {
    try {
      // Simulate bet placement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const market = predictionMarkets.find(m => m.id === marketId)
      if (!market) return

      const shares = amount / (side === 'yes' ? market.yesPrice : market.noPrice)
      const newPosition: UserPosition = {
        marketId,
        side,
        amount,
        shares,
        avgPrice: side === 'yes' ? market.yesPrice : market.noPrice,
        pnl: 0
      }

      setUserPositions(prev => [...prev, newPosition])
      setBetAmount('')
      toast.success('Apuesta colocada exitosamente!')
    } catch (error) {
      toast.error('Error al colocar apuesta')
    }
  }

  const calculatePotentialPayout = (amount: number, side: 'yes' | 'no', market: PredictionMarket) => {
    const price = side === 'yes' ? market.yesPrice : market.noPrice
    const shares = amount / price
    return shares // If correct, you get 1 token per share
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Research Prediction Markets
            </h1>
            <p className="text-lg text-text-secondary">
              Apuesta sobre el éxito de ensayos clínicos y crea liquidez adicional para el pool
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {formatCurrency(6050000)}
              </div>
              <div className="text-sm text-text-secondary">TVL Total</div>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-secondary mb-1">
                {predictionMarkets.length}
              </div>
              <div className="text-sm text-text-secondary">Mercados Activos</div>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {formatCurrency(259000)}
              </div>
              <div className="text-sm text-text-secondary">Volumen 24h</div>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {formatNumber(3218)}
              </div>
              <div className="text-sm text-text-secondary">Participantes</div>
            </GlassCard>
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

          {/* Markets Tab */}
          {selectedTab === 'markets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                  Mercados de Predicción
                </h2>
                <GradientButton onClick={() => setSelectedTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Mercado
                </GradientButton>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {predictionMarkets.map((market, index) => {
                  const CategoryIcon = getCategoryIcon(market.category)
                  return (
                    <motion.div
                      key={market.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <GlassCard hover glow className="h-full">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <CategoryIcon className={`w-6 h-6 ${getCategoryColor(market.category)}`} />
                              <div>
                                <h3 className="text-lg font-semibold text-text-primary">
                                  {market.title}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBg(market.status)} ${getStatusColor(market.status)}`}>
                                    {market.status}
                                  </span>
                                  <span className="text-xs text-text-secondary">
                                    {market.category.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedMarket(market)}
                              className="text-text-secondary hover:text-primary transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-text-secondary text-sm">
                            {market.description}
                          </p>

                          {/* Market Stats */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-text-secondary">Liquidez:</span>
                              <div className="text-text-primary font-semibold">
                                {formatCurrency(market.totalLiquidity)}
                              </div>
                            </div>
                            <div>
                              <span className="text-text-secondary">Volumen 24h:</span>
                              <div className="text-text-primary font-semibold">
                                {formatCurrency(market.volume24h)}
                              </div>
                            </div>
                            <div>
                              <span className="text-text-secondary">Participantes:</span>
                              <div className="text-text-primary font-semibold">
                                {formatNumber(market.participants)}
                              </div>
                            </div>
                            <div>
                              <span className="text-text-secondary">Fin:</span>
                              <div className="text-text-primary font-semibold">
                                {formatDateTime(market.endDate)}
                              </div>
                            </div>
                          </div>

                          {/* Price Display */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-success font-semibold">SÍ</span>
                                <TrendingUp className="w-4 h-4 text-success" />
                              </div>
                              <div className="text-lg font-bold text-success">
                                ${market.yesPrice.toFixed(2)}
                              </div>
                            </div>
                            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-danger font-semibold">NO</span>
                                <TrendingDown className="w-4 h-4 text-danger" />
                              </div>
                              <div className="text-lg font-bold text-danger">
                                ${market.noPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2">
                            <GradientButton
                              size="sm"
                              fullWidth
                              onClick={() => {
                                setSelectedMarket(market)
                                setBetSide('yes')
                              }}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Apostar SÍ
                            </GradientButton>
                            <GradientButton
                              size="sm"
                              variant="danger"
                              fullWidth
                              onClick={() => {
                                setSelectedMarket(market)
                                setBetSide('no')
                              }}
                            >
                              <TrendingDown className="w-4 h-4 mr-2" />
                              Apostar NO
                            </GradientButton>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Positions Tab */}
          {selectedTab === 'positions' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Mis Posiciones
              </h2>

              {userPositions.length > 0 ? (
                <div className="space-y-4">
                  {userPositions.map((position, index) => {
                    const market = predictionMarkets.find(m => m.id === position.marketId)
                    if (!market) return null

                    return (
                      <GlassCard key={index}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {market.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                position.side === 'yes' 
                                  ? 'bg-success/20 text-success' 
                                  : 'bg-danger/20 text-danger'
                              }`}>
                                {position.side.toUpperCase()}
                              </span>
                              <span className="text-text-secondary">
                                {position.shares.toFixed(2)} shares
                              </span>
                              <span className="text-text-secondary">
                                Precio promedio: ${position.avgPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-text-primary">
                              {formatCurrency(position.amount)}
                            </div>
                            <div className={`text-sm font-semibold ${
                              position.pnl >= 0 ? 'text-success' : 'text-danger'
                            }`}>
                              {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    No tienes posiciones
                  </h3>
                  <p className="text-text-secondary mb-6">
                    Comienza a apostar en mercados de predicción
                  </p>
                  <GradientButton onClick={() => setSelectedTab('markets')}>
                    Ver Mercados
                  </GradientButton>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {selectedTab === 'leaderboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Ranking de Traders
              </h2>

              <div className="space-y-4">
                {[
                  { rank: 1, address: '0x1234...5678', pnl: 125000, winRate: 87.5, trades: 24 },
                  { rank: 2, address: '0x9876...5432', pnl: 98000, winRate: 82.1, trades: 18 },
                  { rank: 3, address: '0x5555...7777', pnl: 87000, winRate: 79.3, trades: 22 },
                  { rank: 4, address: '0x3333...9999', pnl: 76000, winRate: 75.0, trades: 16 },
                  { rank: 5, address: '0x1111...2222', pnl: 65000, winRate: 71.4, trades: 20 }
                ].map((trader, index) => (
                  <GlassCard key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/10 text-text-secondary'
                        }`}>
                          {trader.rank}
                        </div>
                        <div>
                          <div className="text-text-primary font-semibold">
                            {trader.address}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {trader.trades} trades • {trader.winRate}% win rate
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-success">
                          +{formatCurrency(trader.pnl)}
                        </div>
                        <div className="text-sm text-text-secondary">
                          P&L Total
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Create Market Tab */}
          {selectedTab === 'create' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Crear Mercado de Predicción
              </h2>

              <GlassCard className="p-8">
                <div className="text-center">
                  <Plus className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Función Próximamente
                  </h3>
                  <p className="text-text-secondary mb-6">
                    La creación de mercados de predicción estará disponible en la próxima versión.
                  </p>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-text-primary">
                      Requisitos para crear mercados:
                    </h4>
                    <ul className="space-y-2 text-text-secondary">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Mínimo 10,000 $SHIELD tokens staked</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Depósito de liquidez inicial de $5,000</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Pregunta debe ser objetiva y verificable</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Fecha de resolución clara y realista</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      {/* Betting Modal */}
      {selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text-primary">
                  Colocar Apuesta
                </h3>
                <button
                  onClick={() => setSelectedMarket(null)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">
                    Mercado:
                  </h4>
                  <p className="text-text-secondary text-sm">
                    {selectedMarket.title}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">
                    Lado de la apuesta:
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setBetSide('yes')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        betSide === 'yes'
                          ? 'bg-success/20 text-success border border-success/30'
                          : 'bg-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      SÍ (${selectedMarket.yesPrice.toFixed(2)})
                    </button>
                    <button
                      onClick={() => setBetSide('no')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        betSide === 'no'
                          ? 'bg-danger/20 text-danger border border-danger/30'
                          : 'bg-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      NO (${selectedMarket.noPrice.toFixed(2)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Cantidad a apostar:
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {betAmount && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary">Shares recibidas:</span>
                      <span className="text-text-primary font-semibold">
                        {(Number(betAmount) / (betSide === 'yes' ? selectedMarket.yesPrice : selectedMarket.noPrice)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary">Pago potencial:</span>
                      <span className="text-success font-semibold">
                        {formatCurrency(calculatePotentialPayout(Number(betAmount), betSide, selectedMarket))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">ROI potencial:</span>
                      <span className="text-accent font-semibold">
                        +{((1 / (betSide === 'yes' ? selectedMarket.yesPrice : selectedMarket.noPrice) - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <GradientButton
                    fullWidth
                    onClick={() => placeBet(selectedMarket.id, betSide, Number(betAmount))}
                    disabled={!betAmount || Number(betAmount) <= 0}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Colocar Apuesta
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
