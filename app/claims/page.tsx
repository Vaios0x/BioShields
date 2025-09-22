'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Eye,
  Download,
  ExternalLink,
  Shield,
  DollarSign,
  Calendar,
  Hash
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { ClaimForm } from '@/components/insurance/ClaimForm'
import { formatCurrency, formatDateTime } from '@/lib/utils'

// Mock data - en producción vendría de hooks/APIs
const mockClaims = [
  {
    id: 'CL-001',
    policyId: 'BS-003',
    policyName: 'Patente - Terapia Genética',
    amount: 2000000,
    status: 'paid',
    submittedAt: new Date('2024-01-20T10:30:00'),
    processedAt: new Date('2024-01-22T14:15:00'),
    payoutTx: '0x1234567890abcdef1234567890abcdef12345678',
    evidence: [
      'https://ipfs.io/ipfs/QmEvidence1',
      'https://ipfs.io/ipfs/QmEvidence2'
    ],
    oracleData: {
      source: 'USPTO',
      timestamp: new Date('2024-01-20T09:00:00'),
      value: 'REJECTED',
      verified: true,
      confidence: 0.95
    }
  },
  {
    id: 'CL-002',
    policyId: 'BS-001',
    policyName: 'Ensayo Clínico Fase II - Cáncer',
    amount: 500000,
    status: 'pending',
    submittedAt: new Date('2024-01-25T16:45:00'),
    evidence: [
      'https://ipfs.io/ipfs/QmEvidence3'
    ],
    oracleData: {
      source: 'ClinicalTrials.gov',
      timestamp: new Date('2024-01-25T15:30:00'),
      value: 'TERMINATED',
      verified: false,
      confidence: 0.0
    }
  },
  {
    id: 'CL-003',
    policyId: 'BS-002',
    policyName: 'Proyecto de Investigación - Alzheimer',
    amount: 1000000,
    status: 'approved',
    submittedAt: new Date('2024-01-28T11:20:00'),
    processedAt: new Date('2024-01-29T09:30:00'),
    evidence: [
      'https://ipfs.io/ipfs/QmEvidence4',
      'https://ipfs.io/ipfs/QmEvidence5'
    ],
    oracleData: {
      source: 'Funding API',
      timestamp: new Date('2024-01-28T10:00:00'),
      value: 'CANCELLED',
      verified: true,
      confidence: 0.98
    }
  }
]

const mockPolicies = [
  {
    id: 'BS-001',
    name: 'Ensayo Clínico Fase II - Cáncer',
    type: 'clinical_trial',
    coverageAmount: 500000,
    status: 'active',
    endDate: new Date('2024-12-15')
  },
  {
    id: 'BS-002',
    name: 'Proyecto de Investigación - Alzheimer',
    type: 'research_funding',
    coverageAmount: 1000000,
    status: 'active',
    endDate: new Date('2025-02-01')
  },
  {
    id: 'BS-003',
    name: 'Patente - Terapia Genética',
    type: 'ip_protection',
    coverageAmount: 2000000,
    status: 'claimed',
    endDate: new Date('2024-11-01')
  }
]

export default function ClaimsPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: FileText },
    { id: 'new', name: 'Nuevo Claim', icon: Plus },
    { id: 'history', name: 'Historial', icon: Clock },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-accent'
      case 'approved': return 'text-success'
      case 'rejected': return 'text-danger'
      case 'paid': return 'text-primary'
      default: return 'text-text-secondary'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent/20'
      case 'approved': return 'bg-success/20'
      case 'rejected': return 'bg-danger/20'
      case 'paid': return 'bg-primary/20'
      default: return 'bg-white/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'approved': return CheckCircle
      case 'rejected': return AlertTriangle
      case 'paid': return DollarSign
      default: return FileText
    }
  }

  const getOracleStatusColor = (verified: boolean, confidence: number) => {
    if (verified && confidence > 0.8) return 'text-success'
    if (verified && confidence > 0.5) return 'text-accent'
    if (!verified) return 'text-danger'
    return 'text-text-secondary'
  }

  const getOracleStatusText = (verified: boolean, confidence: number) => {
    if (verified && confidence > 0.8) return 'Verificado'
    if (verified && confidence > 0.5) return 'Parcialmente verificado'
    if (!verified) return 'No verificado'
    return 'Pendiente'
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      
      <main className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Claims Center
            </h1>
            <p className="text-lg text-text-secondary">
              Gestiona tus claims y monitorea el estado de verificación automática
            </p>
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
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {mockClaims.length}
                  </div>
                  <div className="text-sm text-text-secondary">Claims Totales</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {mockClaims.filter(c => c.status === 'pending').length}
                  </div>
                  <div className="text-sm text-text-secondary">Pendientes</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {mockClaims.filter(c => c.status === 'paid').length}
                  </div>
                  <div className="text-sm text-text-secondary">Pagados</div>
                </GlassCard>
                
                <GlassCard className="text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    {formatCurrency(mockClaims.reduce((sum, claim) => sum + claim.amount, 0))}
                  </div>
                  <div className="text-sm text-text-secondary">Total Claims</div>
                </GlassCard>
              </div>

              {/* Recent Claims */}
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-6">
                  Claims Recientes
                </h2>
                <div className="space-y-4">
                  {mockClaims.slice(0, 3).map((claim) => {
                    const StatusIcon = getStatusIcon(claim.status)
                    return (
                      <GlassCard key={claim.id} hover>
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-text-primary">
                                Claim #{claim.id}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBg(claim.status)} ${getStatusColor(claim.status)}`}>
                                {claim.status}
                              </span>
                            </div>
                            <p className="text-text-secondary text-sm">
                              {claim.policyName}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-text-secondary">
                                Monto: <span className="text-text-primary font-semibold">
                                  {formatCurrency(claim.amount)}
                                </span>
                              </span>
                              <span className="text-text-secondary">
                                Enviado: {formatDateTime(claim.submittedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="text-text-secondary hover:text-primary transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            {claim.payoutTx && (
                              <a
                                href={`https://basescan.org/tx/${claim.payoutTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-secondary hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* New Claim Tab */}
          {selectedTab === 'new' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                  Nuevo Claim
                </h2>
                <GradientButton onClick={() => setShowClaimForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Claim
                </GradientButton>
              </div>

              {/* Available Policies */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Pólizas Elegibles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockPolicies.filter(p => p.status === 'active').map((policy) => (
                    <GlassCard key={policy.id} hover>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-text-primary mb-2">
                            {policy.name}
                          </h4>
                          <p className="text-sm text-text-secondary">
                            ID: {policy.id}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Cobertura:</span>
                            <span className="text-text-primary font-semibold">
                              {formatCurrency(policy.coverageAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Vence:</span>
                            <span className="text-text-primary font-semibold">
                              {policy.endDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <GradientButton
                          size="sm"
                          fullWidth
                          onClick={() => {
                            setSelectedPolicy(policy.id)
                            setShowClaimForm(true)
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Crear Claim
                        </GradientButton>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {selectedTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary">
                Historial de Claims
              </h2>

              <div className="space-y-4">
                {mockClaims.map((claim) => {
                  const StatusIcon = getStatusIcon(claim.status)
                  return (
                    <GlassCard key={claim.id}>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <StatusIcon className={`w-5 h-5 ${getStatusColor(claim.status)}`} />
                              <h3 className="text-lg font-semibold text-text-primary">
                                Claim #{claim.id}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBg(claim.status)} ${getStatusColor(claim.status)}`}>
                                {claim.status}
                              </span>
                            </div>
                            <p className="text-text-secondary">
                              {claim.policyName}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-text-primary">
                              {formatCurrency(claim.amount)}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {formatDateTime(claim.submittedAt)}
                            </div>
                          </div>
                        </div>

                        {/* Oracle Data */}
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Verificación Oracle
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-text-secondary">Fuente:</span>
                              <span className="text-text-primary ml-2 font-semibold">
                                {claim.oracleData.source}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Estado:</span>
                              <span className={`ml-2 font-semibold ${getOracleStatusColor(claim.oracleData.verified, claim.oracleData.confidence)}`}>
                                {getOracleStatusText(claim.oracleData.verified, claim.oracleData.confidence)}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Confianza:</span>
                              <span className="text-text-primary ml-2 font-semibold">
                                {(claim.oracleData.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-text-secondary text-sm">Valor:</span>
                            <span className="text-text-primary ml-2 font-semibold text-sm">
                              {claim.oracleData.value}
                            </span>
                          </div>
                        </div>

                        {/* Evidence */}
                        <div>
                          <h4 className="text-sm font-semibold text-text-primary mb-2">
                            Evidencia ({claim.evidence.length} archivos)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {claim.evidence.map((evidence, idx) => (
                              <a
                                key={idx}
                                href={evidence}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-3 py-2 bg-white/5 rounded-lg text-sm text-text-secondary hover:text-primary transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                <span>Evidencia {idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Transaction */}
                        {claim.payoutTx && (
                          <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary text-sm">Transacción de pago:</span>
                              <a
                                href={`https://basescan.org/tx/${claim.payoutTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors text-sm"
                              >
                                <Hash className="w-4 h-4" />
                                <span>{claim.payoutTx.slice(0, 10)}...</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {claim.processedAt && (
                              <div className="text-text-secondary text-sm mt-1">
                                Procesado: {formatDateTime(claim.processedAt)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Claim Form Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <ClaimForm
              policyId={selectedPolicy}
              onClose={() => {
                setShowClaimForm(false)
                setSelectedPolicy(null)
              }}
            />
          </motion.div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
