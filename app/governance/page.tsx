'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Vote, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Eye,
  BarChart3,
  DollarSign,
  Calendar,
  Hash,
  ExternalLink,
  Zap
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils'

// Mock data - en producción vendría de hooks/APIs
const mockProposals = [
  {
    id: 'PROP-001',
    title: 'Aumentar el APY del Clinical Trials Pool al 18%',
    description: 'Propuesta para incrementar el APY del pool de ensayos clínicos del 15.2% al 18% para atraer más liquidez y mejorar la cobertura del sector.',
    type: 'protocol',
    status: 'active',
    votesFor: 1250000,
    votesAgainst: 450000,
    totalVotes: 1700000,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-22'),
    proposer: '0x1234...5678',
    executionTx: null,
    category: 'treasury'
  },
  {
    id: 'PROP-002',
    title: 'Integrar soporte para ensayos clínicos Fase I',
    description: 'Extender la cobertura de seguros para incluir ensayos clínicos de Fase I, con primas ajustadas según el mayor riesgo.',
    type: 'protocol',
    status: 'passed',
    votesFor: 2100000,
    votesAgainst: 300000,
    totalVotes: 2400000,
    startDate: new Date('2024-01-08'),
    endDate: new Date('2024-01-15'),
    proposer: '0x9876...5432',
    executionTx: '0xabcdef1234567890abcdef1234567890abcdef12',
    category: 'protocol'
  },
  {
    id: 'PROP-003',
    title: 'Reducir comisión de protocolo al 2%',
    description: 'Reducir la comisión del protocolo del 3% al 2% para hacer los seguros más accesibles y competitivos.',
    type: 'treasury',
    status: 'rejected',
    votesFor: 800000,
    votesAgainst: 1600000,
    totalVotes: 2400000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-08'),
    proposer: '0x5555...7777',
    executionTx: null,
    category: 'treasury'
  },
  {
    id: 'PROP-004',
    title: 'Crear pool de liquidez para seguros de dispositivos médicos',
    description: 'Establecer un nuevo pool de liquidez específico para seguros de dispositivos médicos y tecnologías de salud.',
    type: 'protocol',
    status: 'executed',
    votesFor: 1800000,
    votesAgainst: 200000,
    totalVotes: 2000000,
    startDate: new Date('2023-12-25'),
    endDate: new Date('2024-01-01'),
    proposer: '0x3333...9999',
    executionTx: '0x1111222233334444555566667777888899990000',
    category: 'protocol'
  }
]

const mockStats = {
  totalProposals: 24,
  activeProposals: 1,
  passedProposals: 18,
  rejectedProposals: 5,
  totalVoters: 1247,
  treasuryBalance: 2500000,
  shieldTokenPrice: 0.85,
  votingPower: 12500
}

export default function GovernancePage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: BarChart3 },
    { id: 'proposals', name: 'Propuestas', icon: Vote },
    { id: 'treasury', name: 'Tesorería', icon: DollarSign },
    { id: 'create', name: 'Crear Propuesta', icon: Plus },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-accent'
      case 'passed': return 'text-success'
      case 'rejected': return 'text-danger'
      case 'executed': return 'text-primary'
      default: return 'text-text-secondary'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent/20'
      case 'passed': return 'bg-success/20'
      case 'rejected': return 'bg-danger/20'
      case 'executed': return 'bg-primary/20'
      default: return 'bg-white/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock
      case 'passed': return CheckCircle
      case 'rejected': return XCircle
      case 'executed': return CheckCircle
      default: return Vote
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'treasury': return 'text-accent'
      case 'protocol': return 'text-primary'
      case 'governance': return 'text-secondary'
      default: return 'text-text-secondary'
    }
  }

  const calculateVotingProgress = (proposal: any) => {
    const total = proposal.totalVotes
    const forPercentage = (proposal.votesFor / total) * 100
    const againstPercentage = (proposal.votesAgainst / total) * 100
    return { forPercentage, againstPercentage }
  }

  const formatVotingPower = (power: number) => {
    return `${formatNumber(power)} $SHIELD`
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Gobernanza DAO
            </h1>
            <p className="text-lg text-text-secondary">
              Participa en la gobernanza descentralizada del protocolo BioShield
            </p>
          </div>

          {/* Voting Power */}
          <GlassCard className="mb-8 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  Tu Poder de Voto
                </h3>
                <p className="text-text-secondary text-sm">
                  Basado en tus tokens $SHIELD staked
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatVotingPower(mockStats.votingPower)}
                </div>
                <div className="text-sm text-text-secondary">
                  {formatNumber(mockStats.votingPower / mockStats.shieldTokenPrice)} votos
                </div>
              </div>
            </div>
          </GlassCard>

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
                    {mockStats.totalProposals}
                  </div>
                  <div className="text-sm text-text-secondary">Propuestas Totales</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {mockStats.activeProposals}
                  </div>
                  <div className="text-sm text-text-secondary">Activas</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {mockStats.passedProposals}
                  </div>
                  <div className="text-sm text-text-secondary">Aprobadas</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    {mockStats.totalVoters}
                  </div>
                  <div className="text-sm text-text-secondary">Votantes</div>
                </GlassCard>
              </div>

              {/* Recent Proposals */}
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">
                  Propuestas Recientes
                </h2>
                <div className="space-y-4">
                  {mockProposals.slice(0, 3).map((proposal) => {
                    const StatusIcon = getStatusIcon(proposal.status)
                    const { forPercentage, againstPercentage } = calculateVotingProgress(proposal)
                    
                    return (
                      <GlassCard key={proposal.id} hover>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <StatusIcon className={`w-5 h-5 ${getStatusColor(proposal.status)}`} />
                                <h3 className="text-lg font-semibold text-text-primary">
                                  {proposal.title}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBg(proposal.status)} ${getStatusColor(proposal.status)}`}>
                                  {proposal.status}
                                </span>
                              </div>
                              <p className="text-text-secondary text-sm">
                                {proposal.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-text-secondary">
                                <span>ID: {proposal.id}</span>
                                <span>Proponente: {proposal.proposer}</span>
                                <span>Fin: {formatDateTime(proposal.endDate)}</span>
                              </div>
                            </div>
                            <button className="text-text-secondary hover:text-primary transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Voting Results */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Votos a favor:</span>
                              <span className="text-success font-semibold">
                                {formatNumber(proposal.votesFor)} ({forPercentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Votos en contra:</span>
                              <span className="text-danger font-semibold">
                                {formatNumber(proposal.votesAgainst)} ({againstPercentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div className="flex h-2 rounded-full">
                                <div 
                                  className="bg-success"
                                  style={{ width: `${forPercentage}%` }}
                                />
                                <div 
                                  className="bg-danger"
                                  style={{ width: `${againstPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {selectedTab === 'proposals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                  Todas las Propuestas
                </h2>
                <GradientButton onClick={() => setSelectedTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Propuesta
                </GradientButton>
              </div>

              <div className="space-y-4">
                {mockProposals.map((proposal) => {
                  const StatusIcon = getStatusIcon(proposal.status)
                  const { forPercentage, againstPercentage } = calculateVotingProgress(proposal)
                  
                  return (
                    <GlassCard key={proposal.id}>
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <StatusIcon className={`w-5 h-5 ${getStatusColor(proposal.status)}`} />
                              <h3 className="text-xl font-bold text-text-primary">
                                {proposal.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBg(proposal.status)} ${getStatusColor(proposal.status)}`}>
                                {proposal.status}
                              </span>
                            </div>
                            <p className="text-text-secondary">
                              {proposal.description}
                            </p>
                            <div className="flex items-center space-x-6 text-sm text-text-secondary">
                              <span>ID: {proposal.id}</span>
                              <span>Proponente: {proposal.proposer}</span>
                              <span>Inicio: {formatDateTime(proposal.startDate)}</span>
                              <span>Fin: {formatDateTime(proposal.endDate)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(proposal.category)}`}>
                              {proposal.category}
                            </span>
                            <button className="text-text-secondary hover:text-primary transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Voting Results */}
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="text-sm font-semibold text-text-primary mb-3">
                            Resultados de Votación
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Total de votos:</span>
                              <span className="text-text-primary font-semibold">
                                {formatNumber(proposal.totalVotes)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">A favor:</span>
                                <span className="text-success font-semibold">
                                  {formatNumber(proposal.votesFor)} ({forPercentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">En contra:</span>
                                <span className="text-danger font-semibold">
                                  {formatNumber(proposal.votesAgainst)} ({againstPercentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3">
                              <div className="flex h-3 rounded-full">
                                <div 
                                  className="bg-success"
                                  style={{ width: `${forPercentage}%` }}
                                />
                                <div 
                                  className="bg-danger"
                                  style={{ width: `${againstPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {proposal.status === 'active' && (
                          <div className="flex space-x-4">
                            <GradientButton size="sm">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Votar A Favor
                            </GradientButton>
                            <GradientButton size="sm" variant="danger">
                              <XCircle className="w-4 h-4 mr-2" />
                              Votar En Contra
                            </GradientButton>
                          </div>
                        )}

                        {/* Execution */}
                        {proposal.executionTx && (
                          <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary text-sm">Transacción de ejecución:</span>
                              <a
                                href={`https://basescan.org/tx/${proposal.executionTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors text-sm"
                              >
                                <Hash className="w-4 h-4" />
                                <span>{proposal.executionTx.slice(0, 10)}...</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {/* Treasury Tab */}
          {selectedTab === 'treasury' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-text-primary">
                Tesorería DAO
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard>
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Balance de Tesorería
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Balance Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(mockStats.treasuryBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">En USDC:</span>
                        <span className="text-text-primary font-semibold">
                          {formatCurrency(mockStats.treasuryBalance * 0.6)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">En $SHIELD:</span>
                        <span className="text-text-primary font-semibold">
                          {formatNumber(mockStats.treasuryBalance * 0.4 / mockStats.shieldTokenPrice)} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Ingresos del Protocolo
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Último mes:</span>
                        <span className="text-text-primary font-semibold">
                          {formatCurrency(45000)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Últimos 3 meses:</span>
                        <span className="text-text-primary font-semibold">
                          {formatCurrency(125000)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Último año:</span>
                        <span className="text-text-primary font-semibold">
                          {formatCurrency(480000)}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              <GlassCard>
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Distribución de Fondos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-2">
                        60%
                      </div>
                      <div className="text-sm text-text-secondary">
                        Reservas de Liquidez
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-secondary mb-2">
                        25%
                      </div>
                      <div className="text-sm text-text-secondary">
                        Desarrollo del Protocolo
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-accent mb-2">
                        15%
                      </div>
                      <div className="text-sm text-text-secondary">
                        Recompensas de Gobernanza
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Create Proposal Tab */}
          {selectedTab === 'create' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-text-primary">
                Crear Nueva Propuesta
              </h2>

              <GlassCard className="p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      Función Próximamente
                    </h3>
                    <p className="text-text-secondary mb-6">
                      La creación de propuestas estará disponible en la próxima versión del protocolo.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-text-primary">
                      Requisitos para crear propuestas:
                    </h4>
                    <ul className="space-y-2 text-text-secondary">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Mínimo 10,000 $SHIELD tokens staked</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Depósito de 100 $SHIELD como garantía</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Propuesta debe ser clara y detallada</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Período de votación de 7 días</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-center">
                    <GradientButton onClick={() => setSelectedTab('proposals')}>
                      Ver Propuestas Existentes
                    </GradientButton>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
