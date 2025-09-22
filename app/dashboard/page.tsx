'use client'

import { useState, useEffect } from 'react'
// import { motion } from 'framer-motion'
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Eye,
  FileText,
  DollarSign,
  Activity,
  PieChart
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
// import { LivesTokenBalance, ShieldTokenBalance } from '@/components/web3/TokenBalance'
import { ConnectionStatus } from '@/components/web3/ConnectionStatus'
import { LoadingCard } from '@/components/ui/LoadingCard'
import { OnChainDemo } from '@/components/demo/OnChainDemo'
import { formatCurrency } from '@/lib/utils'
import { useInsurance } from '@/hooks/useInsurance'
import { isDemoMode } from '@/lib/config/demo-config'
import Link from 'next/link'

// Mock data - en producción vendría de hooks/APIs
const mockPolicies = [
  {
    id: 'BS-001',
    type: 'clinical_trial',
    name: 'Ensayo Clínico Fase II - Cáncer (Próspera)',
    coverageAmount: 5000000,
    premium: 125000,
    status: 'active',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-15'),
    healthScore: 92,
    riskLevel: 'medium',
    aiRiskScore: 78,
    prosperaFastTrack: true,
    network: 'Solana',
  },
  {
    id: 'BS-002',
    type: 'research_funding',
    name: 'Proyecto de Investigación - Alzheimer (IA Enhanced)',
    coverageAmount: 2000000,
    premium: 80000,
    status: 'active',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-02-01'),
    healthScore: 92,
    riskLevel: 'low',
    network: 'Base Sepolia',
  },
  {
    id: 'BS-003',
    type: 'ip_protection',
    name: 'Patente - Terapia Genética',
    coverageAmount: 2000000,
    premium: 80000,
    status: 'claimed',
    startDate: new Date('2023-11-01'),
    endDate: new Date('2024-11-01'),
    healthScore: 45,
    riskLevel: 'high',
    network: 'Optimism Sepolia',
  },
]

const mockClaims = [
  {
    id: 'CL-001',
    policyId: 'BS-003',
    amount: 2000000,
    status: 'paid',
    submittedAt: new Date('2024-01-20'),
    processedAt: new Date('2024-01-22'),
    payoutTx: '0x1234...5678',
  },
]

const mockStats = {
  totalPolicies: 3,
  activePolicies: 2,
  totalCoverage: 9000000,
  totalPremiums: 285000,
  totalClaims: 1,
  totalPayouts: 2000000,
  healthScore: 92,
  riskExposure: 45,
  aiRiskScore: 78,
  prosperaAdvantage: '70%',
  livesDiscount: 50,
}

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [mounted, setMounted] = useState(false)
  const { policies, claims, loading, error } = useInsurance()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Use real data from hook or fallback to mock data
  const displayPolicies = policies.length > 0 ? policies : mockPolicies
  const displayClaims = claims.length > 0 ? claims : mockClaims

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: PieChart },
    { id: 'policies', name: 'Pólizas', icon: Shield },
    { id: 'claims', name: 'Claims', icon: FileText },
    { id: 'analytics', name: 'Analíticas', icon: Activity },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success'
      case 'expired': return 'text-text-secondary'
      case 'claimed': return 'text-accent'
      case 'cancelled': return 'text-danger'
      default: return 'text-text-secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'expired': return AlertTriangle
      case 'claimed': return DollarSign
      case 'cancelled': return AlertTriangle
      default: return Shield
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success'
      case 'medium': return 'text-accent'
      case 'high': return 'text-danger'
      default: return 'text-text-secondary'
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Dashboard
            </h1>
            <p className="text-text-secondary">
              Gestiona tus pólizas de seguro y monitorea tu portfolio
            </p>
          </div>

          {/* Connection Status */}
          <div className="mb-6">
            <ConnectionStatus />
          </div>

          {/* On-Chain Demo */}
          {isDemoMode() && (
            <div className="mb-8">
              <OnChainDemo />
            </div>
          )}

          {/* Token Balances - Removed to avoid balance loading errors */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <LivesTokenBalance />
            <ShieldTokenBalance />
          </div> */}

          {/* Loading and Error States */}
          {loading && (
            <div className="mb-6">
              <LoadingCard lines={1} />
            </div>
          )}

          {error && (
            <div className="mb-6">
              <GlassCard>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-6 h-6 text-accent" />
                  <div>
                    <span className="text-accent font-semibold">Error al cargar datos</span>
                    <p className="text-text-secondary text-sm">{error}</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

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
                    {mockStats.totalPolicies}
                  </div>
                  <div className="text-sm text-text-secondary">Pólizas Totales</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    {formatCurrency(mockStats.totalCoverage)}
                  </div>
                  <div className="text-sm text-text-secondary">Cobertura Total</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {mockStats.totalClaims}
                  </div>
                  <div className="text-sm text-text-secondary">Claims Procesados</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {mockStats.healthScore}%
                  </div>
                  <div className="text-sm text-text-secondary">Health Score</div>
                </GlassCard>
              </div>

              {/* Health Score & Risk Exposure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Portfolio Health Score
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(mockStats.healthScore / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-text-primary">
                          {mockStats.healthScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-text-secondary text-sm">
                        Tu portfolio tiene un excelente estado de salud. 
                        Mantén la diversificación para optimizar el rendimiento.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Exposición al Riesgo
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Riesgo Total</span>
                      <span className="text-text-primary font-semibold">
                        {mockStats.riskExposure}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                        style={{ width: `${mockStats.riskExposure}%` }}
                      />
                    </div>
                    <p className="text-text-secondary text-sm">
                      Nivel de riesgo moderado. Considera diversificar más tu portfolio.
                    </p>
                  </div>
                </GlassCard>
              </div>

              {/* Quick Actions */}
              <GlassCard>
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/marketplace">
                    <GradientButton fullWidth className="justify-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Póliza
                    </GradientButton>
                  </Link>
                  
                  <Link href="/claims">
                    <GradientButton fullWidth variant="secondary" className="justify-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Enviar Claim
                    </GradientButton>
                  </Link>
                  
                  <Link href="/pools">
                    <GradientButton fullWidth variant="accent" className="justify-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Stake Liquidez
                    </GradientButton>
                  </Link>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Policies Tab */}
          {selectedTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                  Mis Pólizas
                </h2>
                <Link href="/marketplace">
                  <GradientButton>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Póliza
                  </GradientButton>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayPolicies.map((policy) => {
                  const StatusIcon = getStatusIcon(policy.status)
                  return (
                    <GlassCard key={policy.id} hover>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">
                              {policy.name || `Póliza ${policy.type.replace('_', ' ')}`}
                            </h3>
                            <p className="text-sm text-text-secondary">
                              ID: {policy.id}
                            </p>
                          </div>
                          <div className={`flex items-center space-x-1 ${getStatusColor(policy.status)}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm capitalize">{policy.status}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Cobertura:</span>
                            <span className="text-text-primary font-semibold">
                              {formatCurrency(policy.coverageAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Prima:</span>
                            <span className="text-text-primary font-semibold">
                              {formatCurrency(policy.premium)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Health Score:</span>
                            <span className="text-success font-semibold">
                              {policy.healthScore || 85}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Riesgo:</span>
                            <span className={`font-semibold ${getRiskColor(policy.riskLevel || 'medium')}`}>
                              {policy.riskLevel || 'medium'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-text-secondary">
                              Vence: {policy.endDate.toLocaleDateString()}
                            </span>
                            <button className="text-primary hover:text-primary/80 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {/* Claims Tab */}
          {selectedTab === 'claims' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                  Mis Claims
                </h2>
                <Link href="/claims">
                  <GradientButton>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Claim
                  </GradientButton>
                </Link>
              </div>

              <div className="space-y-4">
                {displayClaims.map((claim) => (
                  <GlassCard key={claim.id}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          Claim #{claim.id}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Póliza: {claim.policyId}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-text-secondary">
                            Monto: <span className="text-text-primary font-semibold">
                              {formatCurrency(claim.amount)}
                            </span>
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            claim.status === 'paid' 
                              ? 'bg-success/20 text-success' 
                              : 'bg-accent/20 text-accent'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-text-secondary">
                        <p>Enviado: {claim.submittedAt.toLocaleDateString()}</p>
                        {claim.processedAt && (
                          <p>Procesado: {claim.processedAt.toLocaleDateString()}</p>
                        )}
                        {claim.payoutTx && (
                          <p className="text-primary">
                            TX: {claim.payoutTx.slice(0, 10)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {selectedTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Analíticas del Portfolio
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Distribución por Tipo
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Ensayos Clínicos</span>
                      <span className="text-text-primary font-semibold">33%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Financiación</span>
                      <span className="text-text-primary font-semibold">33%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Protección IP</span>
                      <span className="text-text-primary font-semibold">34%</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Rendimiento Histórico
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">ROI Total</span>
                      <span className="text-success font-semibold">+24.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Claims Rate</span>
                      <span className="text-text-primary font-semibold">33%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Tiempo Promedio</span>
                      <span className="text-text-primary font-semibold">2.1 días</span>
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
