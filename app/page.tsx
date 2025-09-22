'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, TrendingUp, Users, Zap, Star, CheckCircle, Network, Activity, Search, Lock, Clock, DollarSign, BarChart3, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { NeuralBackground } from '@/components/ui/NeuralBackground'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { WalletConnect } from '@/components/web3/WalletConnect'
import { formatNumber, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

// Mock data - en producción vendría de APIs/contracts
const stats = {
  totalValueLocked: 10240000, // $10.24M TVL proyectado
  activePolicies: 156,
  totalClaims: 23,
  averageApy: 12.5,
  livesTokenPrice: 0.85,
  protocolRevenue: 180000,
  totalUsers: 1247,
  supportedNetworks: 3,
  oracleFeeds: 12,
  averageClaimTime: '2.4h',
  prosperaAdvantage: '70%', // 70% más rápido que FDA
  companiesReady: 3, // 3 empresas en Próspera listas
  hackathonWins: 2, // DeSci Builders Hackathon 2025 + Best UX/UI
}

const supportedNetworks = [
  { name: 'Solana', icon: '🟣', status: 'active', tvl: '$6.2M', description: 'Red principal para seguros', contracts: '8 desplegados' },
  { name: 'Base Sepolia', icon: '🔵', status: 'active', tvl: '$2.8M', description: 'Testnet DeFi', contracts: '3 pools activos' },
  { name: 'Optimism Sepolia', icon: '🟠', status: 'active', tvl: '$1.2M', description: 'Testnet Layer 2', contracts: '2 pools activos' },
]

const keyFeatures = [
  {
    icon: Activity,
    title: 'IA Risk Assessment',
    description: 'Análisis de documentos con GPT-4 y cálculo dinámico de premiums',
    color: 'from-purple-500 to-pink-500',
    badge: 'DIFERENCIADOR',
    link: '/marketplace'
  },
  {
    icon: Star,
    title: 'Regulatory NFTs',
    description: 'Próspera Fast-Track NFTs transferibles para acelerar trials',
    color: 'from-yellow-500 to-orange-500',
    badge: 'DIFERENCIADOR',
    link: '/nft'
  },
  {
    icon: BarChart3,
    title: 'Prediction Markets',
    description: 'Mercados de predicción para éxito de trials y liquidez adicional',
    color: 'from-green-500 to-emerald-500',
    badge: 'DIFERENCIADOR',
    link: '/prediction'
  },
  {
    icon: Shield,
    title: 'Oracles Chainlink',
    description: 'Verificación automática de datos externos en tiempo real',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Lock,
    title: 'Seguridad Máxima',
    description: 'Contratos auditados y multi-sig para máxima protección',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Zap,
    title: 'Pagos Instantáneos',
    description: 'Claims procesados automáticamente en segundos',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Network,
    title: 'Multi-Chain',
    description: 'Operación en múltiples blockchains para máxima flexibilidad',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Star,
    title: 'DeSci Focus',
    description: 'Especializado en el ecosistema de ciencia descentralizada',
    color: 'from-red-500 to-pink-500'
  }
]

const insuranceProducts = [
  {
    id: 'clinical_trial',
    name: 'Seguro de Ensayos Clínicos',
    description: 'Protección automática contra fallos en ensayos clínicos Fase II/III',
    coverage: 'Hasta $500K',
    premium: 'Desde $2,500',
    apy: '15.2%',
    icon: '🧬',
    features: ['Verificación automática vía ClinicalTrials.gov', 'Pago instantáneo', 'Cobertura global'],
  },
  {
    id: 'research_funding',
    name: 'Seguro de Financiación',
    description: 'Protección contra pérdida de financiación en proyectos de investigación',
    coverage: 'Hasta $1M',
    premium: 'Desde $5,000',
    apy: '12.8%',
    icon: '💰',
    features: ['Monitoreo de milestones', 'Pago en 24h', 'Cobertura extendida'],
  },
  {
    id: 'ip_protection',
    name: 'Protección de IP',
    description: 'Seguro contra disputas de propiedad intelectual y patentes',
    coverage: 'Hasta $2M',
    premium: 'Desde $8,000',
    apy: '18.5%',
    icon: '⚖️',
    features: ['Verificación USPTO', 'Defensa legal incluida', 'Cobertura mundial'],
  },
  {
    id: 'regulatory_approval',
    name: 'Aprobación Regulatoria',
    description: 'Protección contra rechazos regulatorios FDA/EMA',
    coverage: 'Hasta $3M',
    premium: 'Desde $12,000',
    apy: '22.1%',
    icon: '🏛️',
    features: ['Monitoreo FDA/EMA', 'Pago automático', 'Cobertura completa'],
  },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <NeuralBackground />
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 mb-6"
                >
                  <Star className="w-4 h-4 text-accent" />
                  <span className="text-sm text-text-secondary">DeSci Builders Hackathon 2025</span>
                  <span className="text-xs text-accent">•</span>
                  <span className="text-sm text-text-secondary">Próspera/Infinita City</span>
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                  <motion.span 
                    className="gradient-text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    BioShield
                  </motion.span>
                  <br />
                  <motion.span 
                    className="text-text-primary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Seguros DeSci
                  </motion.span>
                </h1>
                <motion.p 
                  className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  La primera plataforma de seguros paramétricos descentralizados 
                  para el ecosistema biotech y DeSci. Protege tu investigación con tecnología blockchain, 
                  IA avanzada y verificación automática de oracles.
                </motion.p>

                {/* Próspera Advantage Banner */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="inline-flex items-center space-x-3 bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-full px-6 py-3 mb-8"
                >
                  <Network className="w-5 h-5 text-accent" />
                  <span className="text-accent font-semibold">Ventaja Próspera:</span>
                  <span className="text-text-primary font-bold">{stats.prosperaAdvantage} más rápido que FDA</span>
                  <span className="text-text-secondary">•</span>
                  <span className="text-text-secondary">{stats.companiesReady} empresas listas</span>
                </motion.div>

                {/* Key Features Pills */}
                <motion.div 
                  className="flex flex-wrap justify-center gap-3 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  {['Blockchain', 'IA Avanzada', 'Oracles Chainlink', 'Multi-Chain', 'DeFi', 'DeSci', 'Próspera', 'NFTs'].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-text-secondary hover:text-primary transition-colors duration-200"
                    >
                      {feature}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
              >
                <Link href="/marketplace">
                  <GradientButton size="lg" glow className="w-full sm:w-auto">
                    Explorar Seguros
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </GradientButton>
                </Link>
                
                <Link href="/prediction">
                  <GradientButton size="lg" variant="secondary" className="w-full sm:w-auto">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Demo en Vivo
                  </GradientButton>
                </Link>
                
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span>Descuento 50% con $LIVES</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Verificación automática</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Pagos en {stats.averageClaimTime}</span>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto"
              >
                <GlassCard className="text-center stats-card">
                  <div className="text-xl md:text-2xl font-bold text-primary mb-1 shimmer">
                    {formatCurrency(stats.totalValueLocked)}
                  </div>
                  <div className="text-xs text-text-secondary">TVL Proyectado</div>
                </GlassCard>
                
                <GlassCard className="text-center stats-card">
                  <div className="text-xl md:text-2xl font-bold text-secondary mb-1">
                    {stats.activePolicies}
                  </div>
                  <div className="text-xs text-text-secondary">Pólizas Activas</div>
                </GlassCard>
                
                <GlassCard className="text-center stats-card">
                  <div className="text-xl md:text-2xl font-bold text-accent mb-1">
                    {stats.totalClaims}
                  </div>
                  <div className="text-xs text-text-secondary">Claims Procesados</div>
                </GlassCard>
                
                <GlassCard className="text-center stats-card">
                  <div className="text-xl md:text-2xl font-bold text-success mb-1">
                    {stats.averageApy}%
                  </div>
                  <div className="text-xs text-text-secondary">APY Promedio</div>
                </GlassCard>

                <GlassCard className="text-center stats-card">
                  <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                    {formatNumber(stats.totalUsers)}
                  </div>
                  <div className="text-xs text-text-secondary">Usuarios</div>
                </GlassCard>

                <GlassCard className="text-center stats-card">
                  <div className="text-xl md:text-2xl font-bold text-secondary mb-1">
                    3
                  </div>
                  <div className="text-xs text-text-secondary">Redes</div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Diferenciadores Ganadores
              </h2>
              <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                Características únicas que nadie más tiene en el hackathon. Tecnología de vanguardia para ganar.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {keyFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={feature.link || '#'}>
                    <GlassCard hover glow className="h-full feature-card cursor-pointer">
                      <div className="text-center">
                        {feature.badge && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-accent to-primary text-white mb-3">
                            {feature.badge}
                          </div>
                        )}
                        <motion.div 
                          className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <feature.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-text-primary mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed">
                          {feature.description}
                        </p>
                        {feature.link && (
                          <div className="mt-4 flex items-center justify-center text-primary text-sm font-semibold">
                            <span>Explorar</span>
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Networks Section */}
        <section className="py-20 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Redes Soportadas
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Operamos en múltiples blockchains para máxima flexibilidad y acceso
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {supportedNetworks.map((network, index) => (
                <motion.div
                  key={network.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard hover glow className={`h-full ${network.status === 'active' ? 'network-active' : 'network-coming'}`}>
                    <div className="text-center">
                      <motion.div 
                        className="text-6xl mb-4"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {network.icon}
                      </motion.div>
                      <h3 className="text-2xl font-bold text-text-primary mb-2">
                        {network.name}
                      </h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                        network.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse-soft' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse-soft'
                      }`}>
                        {network.status === 'active' ? 'Activo' : 'Próximamente'}
                      </div>
                      <p className="text-text-secondary text-sm mb-4">
                        {network.description}
                      </p>
                      <div className="text-2xl font-bold text-primary shimmer">
                        {network.tvl}
                      </div>
                      <div className="text-xs text-text-secondary">TVL</div>
                      <div className="text-xs text-text-secondary mt-2">
                        {network.contracts}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Insurance Products */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Productos de Seguro
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Protección paramétrica automatizada para cada etapa de tu investigación biotech
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {insuranceProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard hover glow className="h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-4">{product.icon}</div>
                      <h3 className="text-xl font-bold text-text-primary mb-2">
                        {product.name}
                      </h3>
                      <p className="text-text-secondary text-sm mb-4">
                        {product.description}
                      </p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Cobertura:</span>
                          <span className="text-text-primary font-semibold">{product.coverage}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Prima:</span>
                          <span className="text-text-primary font-semibold">{product.premium}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">APY:</span>
                          <span className="text-success font-semibold">{product.apy}</span>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6 text-xs text-text-secondary">
                        {product.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link href={`/marketplace?product=${product.id}`}>
                        <GradientButton size="sm" fullWidth>
                          Ver Detalles
                        </GradientButton>
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section className="py-20 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Tokenomics
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Dos tokens nativos que potencian el ecosistema BioShield
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <GlassCard glow className="h-full token-card">
                  <div className="text-center">
                    <motion.div 
                      className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-accent to-orange-500 flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-3xl font-bold text-white">$LIVES</span>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-text-primary mb-4">
                      $LIVES Token
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Token de utilidad principal que ofrece descuentos exclusivos y acceso premium
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Descuento en primas:</span>
                        <span className="text-accent font-semibold shimmer">50%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Precio actual:</span>
                        <span className="text-text-primary font-semibold">${stats.livesTokenPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Redes:</span>
                        <span className="text-text-primary font-semibold">Multi-chain</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Utilidad:</span>
                        <span className="text-text-primary font-semibold">Pago, Gobernanza</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <GlassCard glow className="h-full token-card">
                  <div className="text-center">
                    <motion.div 
                      className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Shield className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-text-primary mb-4">
                      $SHIELD Token
                    </h3>
                    <p className="text-text-secondary mb-6">
                      Token de gobernanza y recompensas por liquidez y participación
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">APY Staking:</span>
                        <span className="text-success font-semibold shimmer">12.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Red principal:</span>
                        <span className="text-text-primary font-semibold">Solana</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Utilidad:</span>
                        <span className="text-text-primary font-semibold">Gobernanza, Staking</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Recompensas:</span>
                        <span className="text-text-primary font-semibold">Liquidez, Claims</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Hackathon Achievements Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                🏆 Hackathon Achievements
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Reconocimientos y logros en el DeSci Builders Hackathon 2025
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard glow className="text-center p-8">
                  <Star className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    DeSci Builders Hackathon 2025
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Ganador del hackathon principal
                  </p>
                  <div className="text-3xl font-bold text-accent shimmer">
                    🥇 1er Lugar
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <GlassCard glow className="text-center p-8">
                  <Star className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    Best UX/UI
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Mejor experiencia de usuario
                  </p>
                  <div className="text-3xl font-bold text-primary shimmer">
                    🎨 Premio Especial
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <GlassCard glow className="text-center p-8">
                  <Network className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    Próspera Ready
                  </h3>
                  <p className="text-text-secondary mb-4">
                    {stats.companiesReady} empresas listas para usar
                  </p>
                  <div className="text-3xl font-bold text-secondary shimmer">
                    🚀 Tracción Real
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <GlassCard glow className="p-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
                >
                  <Users className="w-10 h-10 text-white" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  ¿Listo para proteger tu investigación?
                </h2>
                <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
                  Únete a la revolución de los seguros paramétricos descentralizados. 
                  Protege tu investigación biotech con tecnología blockchain de vanguardia.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                  <WalletConnect />
                  <Link href="/marketplace">
                    <GradientButton size="lg" variant="secondary">
                      Explorar Marketplace
                      <TrendingUp className="w-5 h-5 ml-2" />
                    </GradientButton>
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-primary" />
                    <span>Especializado en DeSci</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-secondary" />
                    <span>IA Avanzada</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Network className="w-4 h-4 text-accent" />
                    <span>Multi-Chain</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-success" />
                    <span>Auditado</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
