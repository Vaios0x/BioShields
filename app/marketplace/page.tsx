'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle,
  Star,
  Calculator,
  Zap,
  DollarSign,
  Activity
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { PremiumCalculator } from '@/components/insurance/PremiumCalculator'
import { AIRiskAssessment } from '@/components/insurance/AIRiskAssessment'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useWeb3Connection } from '@/hooks/useWeb3Connection'
import { useTransactionService } from '@/hooks/useTransactionService'
import { useInsurance } from '@/hooks/useInsurance'
import { useLivesToken } from '@/hooks/useLivesToken'
import toast from 'react-hot-toast'

const insuranceProducts = [
  {
    id: 'clinical_trial',
    name: 'Seguro de Ensayos Clínicos',
    description: 'Protección automática contra fallos en ensayos clínicos Fase II/III con verificación vía ClinicalTrials.gov y IA avanzada',
    coverage: 'Hasta $5M',
    premium: 'Desde $12,500',
    apy: '18.5%',
    icon: '🧬',
    category: 'clinical',
    riskLevel: 'medium',
    features: [
      'Verificación automática vía ClinicalTrials.gov',
      'IA Risk Assessment con GPT-4',
      'Pago instantáneo al cumplirse condiciones',
      'Cobertura global para ensayos Fase II/III',
      'Sin documentación manual requerida',
      'Descuento 50% con $LIVES token',
      'Próspera Fast-Track disponible',
      'Multi-chain: Solana, Base Sepolia, Optimism Sepolia'
    ],
    requirements: [
      'Protocolo de ensayo registrado en ClinicalTrials.gov',
      'Identificador único del ensayo',
      'Definición clara de criterios de éxito'
    ],
    examples: [
      'Ensayo Fase II fallido por eficacia insuficiente',
      'Ensayo Fase III interrumpido por seguridad',
      'No alcanzar endpoint primario estadísticamente significativo'
    ]
  },
  {
    id: 'research_funding',
    name: 'Seguro de Financiación',
    description: 'Protección contra pérdida de financiación en proyectos de investigación con monitoreo de milestones y IA predictiva',
    coverage: 'Hasta $2M',
    premium: 'Desde $8,000',
    apy: '15.2%',
    icon: '💰',
    category: 'funding',
    riskLevel: 'low',
    features: [
      'Monitoreo automático de milestones',
      'IA predictiva para riesgo de financiación',
      'Pago en 24 horas tras verificación',
      'Cobertura extendida por 12 meses',
      'Soporte para múltiples fuentes de financiación',
      'Descuento 50% con $LIVES token',
      'Próspera Fast-Track disponible',
      'Multi-chain: Solana, Base Sepolia, Optimism Sepolia'
    ],
    requirements: [
      'Contrato de financiación firmado',
      'Milestones claramente definidos',
      'Cronograma de entregables establecido'
    ],
    examples: [
      'Pérdida de financiación por incumplimiento de milestone',
      'Reducción de presupuesto por cambios regulatorios',
      'Cancelación de proyecto por restructuración institucional'
    ]
  },
  {
    id: 'ip_protection',
    name: 'Protección de IP',
    description: 'Seguro contra disputas de propiedad intelectual y patentes con verificación USPTO y análisis de IA',
    coverage: 'Hasta $3M',
    premium: 'Desde $15,000',
    apy: '22.1%',
    icon: '⚖️',
    category: 'ip',
    riskLevel: 'high',
    features: [
      'Verificación automática USPTO',
      'IA para análisis de riesgo de disputas',
      'Defensa legal incluida hasta $500K',
      'Cobertura mundial para patentes',
      'Monitoreo de infracciones 24/7',
      'Descuento 50% con $LIVES token',
      'Multi-chain: Solana, Base Sepolia, Optimism Sepolia'
    ],
    requirements: [
      'Aplicación de patente presentada',
      'Número de aplicación USPTO',
      'Documentación de invención completa'
    ],
    examples: [
      'Disputa de prioridad de invención',
      'Infracción de patente por terceros',
      'Rechazo de patente por arte previo'
    ]
  },
  {
    id: 'regulatory_approval',
    name: 'Aprobación Regulatoria',
    description: 'Protección contra rechazos regulatorios FDA/EMA con monitoreo automático y Próspera Fast-Track',
    coverage: 'Hasta $5M',
    premium: 'Desde $20,000',
    apy: '25.3%',
    icon: '🏛️',
    category: 'regulatory',
    riskLevel: 'high',
    features: [
      'Monitoreo automático FDA/EMA',
      'Próspera Fast-Track NFT incluido',
      'Pago automático tras rechazo oficial',
      'Cobertura completa de costos regulatorios',
      'Soporte para múltiples jurisdicciones',
      'Descuento 50% con $LIVES token',
      '70% más rápido que FDA tradicional',
      'Multi-chain: Solana, Base Sepolia, Optimism Sepolia'
    ],
    requirements: [
      'Aplicación regulatoria presentada',
      'Número de referencia FDA/EMA',
      'Documentación completa del producto'
    ],
    examples: [
      'Rechazo de NDA por FDA',
      'Rechazo de MAA por EMA',
      'Requerimiento de estudios adicionales'
    ]
  },
]

const filters = {
  category: ['all', 'clinical', 'funding', 'ip', 'regulatory'],
  riskLevel: ['all', 'low', 'medium', 'high'],
  coverage: ['all', 'under-1m', '1m-2m', '2m-3m', '3m-5m', 'over-5m'],
}

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'all',
    riskLevel: 'all',
    coverage: 'all',
  })
  const [showCalculator, setShowCalculator] = useState(false)
  const [showAIRisk, setShowAIRisk] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Web3 connections
  const { 
    isConnected, 
    currentNetwork, 
    address, 
    connectWallet,
    getNetworkDisplayName,
    getAddressDisplay 
  } = useWeb3Connection()
  
  const transactionService = useTransactionService()
  const { createPolicy, loading: insuranceLoading } = useInsurance()
  const { balance: livesBalance, calculateDiscount, hasEnoughBalance } = useLivesToken()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePurchaseInsurance = async (product: any) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      await connectWallet()
      return
    }

    if (!transactionService) {
      toast.error('Transaction service not available')
      return
    }

    try {
      const coverageAmount = parseFloat(product.coverage.replace(/[^\d.]/g, ''))
      const premium = parseFloat(product.premium.replace(/[^\d.]/g, ''))
      
      const triggerConditions = {
        clinicalTrialId: 'NCT12345678', // Mock ID
        dataSource: 'clinicaltrials.gov' as const
      }

      const result = await createPolicy(
        coverageAmount,
        premium,
        triggerConditions,
        false // payWithLives - could be made configurable
      )

      if (result.success) {
        toast.success('Insurance policy created successfully!')
      } else {
        toast.error(result.error || 'Failed to create policy')
      }
    } catch (error) {
      console.error('Error purchasing insurance:', error)
      toast.error('Failed to purchase insurance')
    }
  }

  if (!mounted) {
    return null
  }

  const filteredProducts = insuranceProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedFilters.category === 'all' || product.category === selectedFilters.category
    const matchesRisk = selectedFilters.riskLevel === 'all' || product.riskLevel === selectedFilters.riskLevel
    
    let matchesCoverage = true
    if (selectedFilters.coverage !== 'all') {
      const coverageAmount = parseFloat(product.coverage.replace(/[^\d.]/g, ''))
      switch (selectedFilters.coverage) {
        case 'under-500k':
          matchesCoverage = coverageAmount < 500000
          break
        case '500k-1m':
          matchesCoverage = coverageAmount >= 500000 && coverageAmount < 1000000
          break
        case '1m-2m':
          matchesCoverage = coverageAmount >= 1000000 && coverageAmount < 2000000
          break
        case 'over-2m':
          matchesCoverage = coverageAmount >= 2000000
          break
      }
    }

    return matchesSearch && matchesCategory && matchesRisk && matchesCoverage
  })

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

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Marketplace de Seguros
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Protege tu investigación con seguros paramétricos descentralizados. 
              Verificación automática, pagos instantáneos, descuentos con $LIVES.
            </p>
          </div>

          {/* Connection Status */}
          {isConnected && (
            <div className="mb-6">
              <GlassCard className="p-4 bg-gradient-to-r from-success/10 to-primary/10 border border-success/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-success">
                        Wallet Conectado
                      </div>
                      <div className="text-xs text-text-secondary">
                        {getNetworkDisplayName(currentNetwork)} • {getAddressDisplay(address)}
                      </div>
                    </div>
                  </div>
                  {livesBalance > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-accent">
                        {formatNumber(livesBalance)} $LIVES
                      </div>
                      <div className="text-xs text-text-secondary">
                        50% descuento disponible
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {/* AI Risk Assessment Banner */}
          <div className="mb-8">
            <GlassCard className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      AI Risk Assessment
                    </h3>
                    <p className="text-text-secondary text-sm">
                      Analiza tu protocolo con GPT-4 y obtén primas optimizadas
                    </p>
                  </div>
                </div>
                <GradientButton onClick={() => setShowAIRisk(true)}>
                  <Activity className="w-4 h-4 mr-2" />
                  Analizar con IA
                </GradientButton>
              </div>
            </GlassCard>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <GlassCard className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar seguros..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <select
                    value={selectedFilters.category}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="clinical">Ensayos Clínicos</option>
                    <option value="funding">Financiación</option>
                    <option value="ip">Propiedad Intelectual</option>
                    <option value="regulatory">Regulatorio</option>
                  </select>

                  <select
                    value={selectedFilters.riskLevel}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Todos los riesgos</option>
                    <option value="low">Riesgo Bajo</option>
                    <option value="medium">Riesgo Medio</option>
                    <option value="high">Riesgo Alto</option>
                  </select>

                  <select
                    value={selectedFilters.coverage}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, coverage: e.target.value }))}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Toda la cobertura</option>
                    <option value="under-500k">Menos de $500K</option>
                    <option value="500k-1m">$500K - $1M</option>
                    <option value="1m-2m">$1M - $2M</option>
                    <option value="over-2m">Más de $2M</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlassCard hover glow className="h-full">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                      <div className="text-5xl mb-4">{product.icon}</div>
                      <h3 className="text-xl font-bold text-text-primary mb-2">
                        {product.name}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Cobertura:</span>
                        <span className="text-text-primary font-semibold">{product.coverage}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Prima:</span>
                        <span className="text-text-primary font-semibold">{product.premium}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">APY:</span>
                        <span className="text-success font-semibold">{product.apy}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Riesgo:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBg(product.riskLevel)} ${getRiskColor(product.riskLevel)}`}>
                          {product.riskLevel}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">
                        Características principales:
                      </h4>
                      <ul className="space-y-1">
                        {product.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-text-secondary">
                            <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <GradientButton 
                        fullWidth 
                        onClick={() => {
                          setSelectedProduct(product.id)
                          setShowCalculator(true)
                        }}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calcular Prima
                      </GradientButton>
                      
                      <GradientButton 
                        fullWidth 
                        variant="secondary"
                        onClick={() => handlePurchaseInsurance(product)}
                        disabled={insuranceLoading}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {insuranceLoading ? 'Procesando...' : 'Comprar Seguro'}
                      </GradientButton>
                    </div>

                    {/* LIVES Discount Badge */}
                    <div className="flex items-center justify-center space-x-2 text-accent text-sm font-semibold">
                      <Zap className="w-4 h-4" />
                      <span>50% descuento con $LIVES</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No se encontraron seguros
              </h3>
              <p className="text-text-secondary">
                Intenta ajustar los filtros o términos de búsqueda
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Premium Calculator Modal */}
      {showCalculator && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl"
          >
            <PremiumCalculator
              productId={selectedProduct}
              onClose={() => {
                setShowCalculator(false)
                setSelectedProduct(null)
              }}
            />
          </motion.div>
        </div>
      )}

      {/* AI Risk Assessment Modal */}
      {showAIRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <AIRiskAssessment
              onClose={() => setShowAIRisk(false)}
            />
          </motion.div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
