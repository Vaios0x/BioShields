'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ExternalLink,
  Copy,
  Zap,
  Shield,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  XCircle
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { OnChainDemo } from '@/components/demo/OnChainDemo'
import { InteractiveDemo } from '@/components/demo/InteractiveDemo'
import { useWeb3Connection } from '@/hooks/useWeb3Connection'
import { useInsurance } from '@/hooks/useInsurance'
import { useLivesToken } from '@/hooks/useLivesToken'
import { isDemoMode } from '@/lib/config/demo-config'
import { formatCurrency, formatNumber, truncateAddress } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function DemoPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'demo' | 'interactive' | 'features'>('overview')

  const { 
    isConnected, 
    currentNetwork, 
    address, 
    getNetworkDisplayName,
    getAddressDisplay 
  } = useWeb3Connection()
  
  const { policies, loading: insuranceLoading } = useInsurance()
  const { balance: livesBalance } = useLivesToken()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const demoFeatures = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Seguros Paramétricos",
      description: "Protección automática contra fallos en ensayos clínicos con verificación vía oráculos",
      status: "✅ Implementado"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Tokens $LIVES",
      description: "Sistema de descuentos con tokens de utilidad para primas más bajas",
      status: "✅ Implementado"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Pool de Liquidez",
      description: "Sistema de liquidez descentralizado para respaldar las pólizas",
      status: "✅ Implementado"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Multi-Chain",
      description: "Soporte para Solana, Base, Optimism y más redes",
      status: "✅ Implementado"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "IA Risk Assessment",
      description: "Evaluación de riesgo con GPT-4 para primas optimizadas",
      status: "✅ Implementado"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "PWA Mobile",
      description: "Aplicación web progresiva con soporte móvil completo",
      status: "✅ Implementado"
    }
  ]

  const demoStats = [
    {
      label: "Pólizas Activas",
      value: policies.length,
      icon: <Shield className="w-5 h-5" />,
      color: "text-primary"
    },
    {
      label: "Balance $LIVES",
      value: formatNumber(livesBalance),
      icon: <Zap className="w-5 h-5" />,
      color: "text-accent"
    },
    {
      label: "Red Conectada",
      value: getNetworkDisplayName(currentNetwork),
      icon: <ExternalLink className="w-5 h-5" />,
      color: "text-success"
    },
    {
      label: "Wallet",
      value: isConnected ? getAddressDisplay(address) : "No conectado",
      icon: <Copy className="w-5 h-5" />,
      color: isConnected ? "text-success" : "text-error"
    }
  ]

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
                🚀 Demo BioShield
              </h1>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Demuestra las funcionalidades completas de BioShield Insurance: 
                seguros paramétricos, tokens $LIVES, multi-chain y más.
              </p>
            </motion.div>
          </div>

          {/* Demo Mode Banner */}
          {isDemoMode() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <GlassCard className="p-6 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        Modo Demo Activo
                      </h3>
                      <p className="text-text-secondary text-sm">
                        Todas las transacciones son simuladas para demostración segura
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-accent">
                      DeSci Builders Hackathon
                    </div>
                    <div className="text-xs text-text-secondary">
                      Ready to Win! 🏆
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: 'overview', label: 'Resumen', icon: <XCircle className="w-4 h-4" /> },
                { id: 'demo', label: 'Demo On-Chain', icon: <Activity className="w-4 h-4" /> },
                { id: 'interactive', label: 'Demo Interactivo', icon: <Zap className="w-4 h-4" /> },
                { id: 'features', label: 'Características', icon: <CheckCircle className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {demoStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <GlassCard className="p-6 text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-text-primary mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {stat.label}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Connection Status */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Estado de Conexión
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Wallet:</span>
                      <span className={`font-medium ${isConnected ? 'text-success' : 'text-error'}`}>
                        {isConnected ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Red:</span>
                      <span className="font-medium text-text-primary">
                        {getNetworkDisplayName(currentNetwork)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Dirección:</span>
                      <span className="font-mono text-sm text-text-primary">
                        {isConnected ? getAddressDisplay(address) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Balance $LIVES:</span>
                      <span className="font-medium text-accent">
                        {formatNumber(livesBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Pólizas:</span>
                      <span className="font-medium text-text-primary">
                        {policies.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Modo:</span>
                      <span className="font-medium text-accent">
                        Demo
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Quick Actions */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GradientButton 
                    fullWidth
                    onClick={() => setActiveTab('interactive')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Ejecutar Demo Interactivo
                  </GradientButton>
                  <GradientButton 
                    fullWidth
                    variant="secondary"
                    onClick={() => window.open('/marketplace', '_blank')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Ir al Marketplace
                  </GradientButton>
                  <GradientButton 
                    fullWidth
                    variant="secondary"
                    onClick={() => window.open('/dashboard', '_blank')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Dashboard
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'demo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  🚀 Demo On-Chain Real
                </h2>
                <p className="text-text-secondary">
                  Ejecuta transacciones reales en testnet y ve los hashes de confirmación
                </p>
              </div>
              <OnChainDemo />
            </motion.div>
          )}

          {activeTab === 'interactive' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <InteractiveDemo />
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <GlassCard className="p-6 h-full">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-text-secondary text-sm mb-3">
                            {feature.description}
                          </p>
                          <div className="text-xs font-medium text-success">
                            {feature.status}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Technical Details */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Detalles Técnicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Frontend</h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      <li>• Next.js 14 con App Router</li>
                      <li>• TypeScript + TailwindCSS</li>
                      <li>• Framer Motion para animaciones</li>
                      <li>• PWA habilitada</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary mb-2">Blockchain</h4>
                    <ul className="text-sm text-text-secondary space-y-1">
                      <li>• Solana (Rust/Anchor)</li>
                      <li>• Ethereum/Base (Solidity)</li>
                      <li>• Optimism (Solidity)</li>
                      <li>• Wagmi + Reown AppKit</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
