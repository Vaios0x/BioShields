'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Award, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Copy,
  Star,
  Shield,
  Crown,
  Gift,
  Users,
  BarChart3
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { RegulatoryNFT } from '@/components/nft/RegulatoryNFT'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function NFTPage() {
  const [selectedTab, setSelectedTab] = useState('mint')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const tabs = [
    { id: 'mint', name: 'Mintear NFT', icon: Award },
    { id: 'marketplace', name: 'Marketplace', icon: TrendingUp },
    { id: 'benefits', name: 'Beneficios', icon: Star },
    { id: 'stats', name: 'Estadísticas', icon: BarChart3 },
  ]

  const nftStats = {
    totalMinted: 1247,
    totalVolume: 2500000,
    averagePrice: 8500,
    activeBenefits: 89,
    totalUsers: 456,
    successRate: 94.2
  }

  const benefits = [
    {
      title: 'Aprobación Regulatoria 70% Más Rápida',
      description: 'Acceso prioritario a procesos regulatorios en Próspera',
      icon: Clock,
      impact: '70%',
      color: 'text-primary'
    },
    {
      title: 'Descuento 25% en Fees Regulatorios',
      description: 'Reducción significativa en costos de aprobación',
      icon: DollarSign,
      impact: '25%',
      color: 'text-success'
    },
    {
      title: 'Acceso Prioritario a Comités',
      description: 'Revisión acelerada por comités de ética y regulación',
      icon: Users,
      impact: 'VIP',
      color: 'text-accent'
    },
    {
      title: 'Transferible y Vendible',
      description: 'NFTs completamente transferibles en marketplace',
      icon: TrendingUp,
      impact: '100%',
      color: 'text-secondary'
    }
  ]

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Próspera Regulatory Fast-Track NFTs
            </h1>
            <p className="text-lg text-text-secondary">
              NFTs que aceleran procesos regulatorios en Próspera y son completamente transferibles
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {formatNumber(nftStats.totalMinted)}
              </div>
              <div className="text-sm text-text-secondary">NFTs Minteados</div>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-secondary mb-1">
                {formatCurrency(nftStats.totalVolume)}
              </div>
              <div className="text-sm text-text-secondary">Volumen Total</div>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {formatCurrency(nftStats.averagePrice)}
              </div>
              <div className="text-sm text-text-secondary">Precio Promedio</div>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {nftStats.successRate}%
              </div>
              <div className="text-sm text-text-secondary">Tasa de Éxito</div>
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

          {/* Mint Tab */}
          {selectedTab === 'mint' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Mintear NFT de Próspera
                </h2>
                <p className="text-text-secondary">
                  Obtén acceso prioritario a procesos regulatorios en Próspera
                </p>
              </div>
              <RegulatoryNFT />
            </div>
          )}

          {/* Marketplace Tab */}
          {selectedTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Marketplace de NFTs
                </h2>
                <p className="text-text-secondary">
                  Compra y vende NFTs de Próspera Regulatory Fast-Track
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: 'NFT-001',
                    name: 'Próspera Fast-Track Approval',
                    rarity: 'epic',
                    price: 50000,
                    seller: '0x1234...5678',
                    benefits: ['70% más rápido', '25% descuento', 'Acceso prioritario']
                  },
                  {
                    id: 'NFT-002',
                    name: 'Clinical Trial Accelerator',
                    rarity: 'rare',
                    price: 35000,
                    seller: '0x9876...5432',
                    benefits: ['50% más rápido', 'Red de pacientes', 'Soporte técnico']
                  },
                  {
                    id: 'NFT-003',
                    name: 'Regulatory Compliance Master',
                    rarity: 'legendary',
                    price: 100000,
                    seller: '0x5555...7777',
                    benefits: ['90% más rápido', 'Acceso completo', 'Consultoría gratuita']
                  }
                ].map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <GlassCard hover glow className="h-full">
                      <div className="space-y-4">
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                          <Award className="w-16 h-16 text-primary" />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {nft.name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-400/20 text-purple-400">
                              {nft.rarity.toUpperCase()}
                            </span>
                            <span className="text-xs text-text-secondary">
                              ID: {nft.id}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Beneficios:
                          </h4>
                          <ul className="space-y-1">
                            {nft.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-xs text-text-secondary">
                                <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <div className="text-sm text-text-secondary">Vendedor:</div>
                              <div className="text-xs text-text-primary font-mono">
                                {nft.seller}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-text-secondary">Precio:</div>
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(nft.price)}
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <GradientButton size="sm" fullWidth>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Comprar
                            </GradientButton>
                            <GradientButton size="sm" variant="secondary" fullWidth>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver
                            </GradientButton>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {selectedTab === 'benefits' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Beneficios de los NFTs
                </h2>
                <p className="text-text-secondary">
                  Ventajas exclusivas para poseedores de NFTs de Próspera
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <GlassCard hover glow className="h-full">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-text-primary">
                                {benefit.title}
                              </h3>
                              <p className="text-text-secondary text-sm">
                                {benefit.description}
                              </p>
                            </div>
                          </div>

                          <div className="text-center p-4 bg-white/5 rounded-lg">
                            <div className={`text-3xl font-bold ${benefit.color} mb-1`}>
                              {benefit.impact}
                            </div>
                            <div className="text-sm text-text-secondary">
                              Impacto
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )
                })}
              </div>

              <GlassCard className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <div className="text-center">
                  <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    ¿Por qué Próspera?
                  </h3>
                  <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                    Próspera ofrece el marco regulatorio más avanzado para biotech, 
                    con procesos 70% más rápidos que la FDA tradicional y sin 
                    requisitos burocráticos excesivos.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success mb-1">70%</div>
                      <div className="text-text-secondary">Más rápido que FDA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent mb-1">90%</div>
                      <div className="text-text-secondary">Menos burocracia</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">100%</div>
                      <div className="text-text-secondary">Transparente</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Stats Tab */}
          {selectedTab === 'stats' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Estadísticas del Marketplace
                </h2>
                <p className="text-text-secondary">
                  Métricas y análisis del ecosistema de NFTs de Próspera
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Distribución por Rareza
                  </h3>
                  <div className="space-y-3">
                    {[
                      { rarity: 'Common', count: 456, percentage: 36.6, color: 'bg-gray-400' },
                      { rarity: 'Rare', count: 312, percentage: 25.0, color: 'bg-blue-400' },
                      { rarity: 'Epic', count: 289, percentage: 23.2, color: 'bg-purple-400' },
                      { rarity: 'Legendary', count: 190, percentage: 15.2, color: 'bg-yellow-400' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary text-sm">{item.rarity}</span>
                          <span className="text-text-primary font-semibold text-sm">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Actividad del Marketplace
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Ventas 24h:</span>
                      <span className="text-text-primary font-semibold">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Volumen 24h:</span>
                      <span className="text-text-primary font-semibold">{formatCurrency(125000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Precio promedio:</span>
                      <span className="text-text-primary font-semibold">{formatCurrency(5435)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Usuarios activos:</span>
                      <span className="text-text-primary font-semibold">{formatNumber(156)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Tasa de éxito:</span>
                      <span className="text-success font-semibold">{nftStats.successRate}%</span>
                    </div>
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
