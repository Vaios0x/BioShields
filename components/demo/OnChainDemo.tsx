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
  DollarSign
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { useWeb3Connection } from '@/hooks/useWeb3Connection'
import { useTransactionService } from '@/hooks/useTransactionService'
import { useInsurance } from '@/hooks/useInsurance'
import { useLivesToken } from '@/hooks/useLivesToken'
import { getDemoConfig, isDemoMode } from '@/lib/config/demo-config'
import { formatCurrency, formatNumber, truncateAddress } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DemoStep {
  id: string
  title: string
  description: string
  action: () => Promise<void>
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
}

export function OnChainDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<DemoStep[]>([])
  
  const { 
    isConnected, 
    currentNetwork, 
    address, 
    connectWallet,
    getNetworkDisplayName 
  } = useWeb3Connection()
  
  const transactionService = useTransactionService()
  const { createPolicy, policies, loading: insuranceLoading } = useInsurance()
  const { balance: livesBalance, approve } = useLivesToken()

  const demoConfig = getDemoConfig()

  useEffect(() => {
    initializeSteps()
  }, [isConnected, currentNetwork])

  const initializeSteps = () => {
    const newSteps: DemoStep[] = [
      {
        id: 'connect-wallet',
        title: 'Conectar Wallet',
        description: 'Conecta tu wallet para interactuar con los contratos inteligentes',
        action: connectWallet,
        status: isConnected ? 'completed' : 'pending'
      },
      {
        id: 'check-balance',
        title: 'Verificar Balance de $LIVES',
        description: 'Revisa tu balance de tokens $LIVES para descuentos',
        action: async () => {
          // Mock action - in real implementation would fetch real balance
          await new Promise(resolve => setTimeout(resolve, 1000))
        },
        status: livesBalance > 0 ? 'completed' : 'pending'
      },
      {
        id: 'create-policy',
        title: 'Crear Póliza de Seguro',
        description: 'Crea una póliza de seguro para ensayos clínicos',
        action: async () => {
          const result = await createPolicy(
            500000, // coverage amount
            25000,  // premium
            {
              clinicalTrialId: 'NCT12345678',
              dataSource: 'clinicaltrials.gov'
            },
            false // payWithLives
          )
          if (!result.success) {
            throw new Error(result.error)
          }
        },
        status: 'pending'
      },
      {
        id: 'approve-lives',
        title: 'Aprobar $LIVES para Descuento',
        description: 'Aprueba el uso de tokens $LIVES para obtener 50% de descuento',
        action: async () => {
          if (address) {
            const networkConfig = demoConfig.networks[currentNetwork]
            const contractAddress = 'contract' in networkConfig ? networkConfig.contract : ''
            if (contractAddress) {
              await approve(contractAddress, 12500) // half of premium
            }
          }
        },
        status: 'pending'
      },
      {
        id: 'view-policies',
        title: 'Ver Pólizas Activas',
        description: 'Revisa todas tus pólizas de seguro activas',
        action: async () => {
          // Mock action - policies are already loaded
          await new Promise(resolve => setTimeout(resolve, 500))
        },
        status: policies.length > 0 ? 'completed' : 'pending'
      }
    ]

    setSteps(newSteps)
  }

  const runStep = async (stepIndex: number) => {
    if (stepIndex >= steps.length) return

    const step = steps[stepIndex]
    setCurrentStep(stepIndex)
    
    // Update step status to running
    setSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'running' } : s
    ))

    try {
      await step.action()
      
      // Update step status to completed
      setSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'completed' } : s
      ))

      toast.success(`${step.title} completado exitosamente!`)
      
      // Auto-advance to next step after a delay
      setTimeout(() => {
        if (stepIndex < steps.length - 1) {
          runStep(stepIndex + 1)
        }
      }, 1500)

    } catch (error) {
      // Update step status to error
      setSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { 
          ...s, 
          status: 'error',
          result: error instanceof Error ? error.message : 'Error desconocido'
        } : s
      ))

      toast.error(`Error en ${step.title}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const runFullDemo = async () => {
    setIsRunning(true)
    setCurrentStep(0)

    try {
      for (let i = 0; i < steps.length; i++) {
        await runStep(i)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } finally {
      setIsRunning(false)
    }
  }

  const getStepIcon = (status: DemoStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-error" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-text-secondary" />
    }
  }

  const getStepColor = (status: DemoStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-success/20 bg-success/5'
      case 'running':
        return 'border-primary/20 bg-primary/5'
      case 'error':
        return 'border-error/20 bg-error/5'
      default:
        return 'border-white/10 bg-white/5'
    }
  }

  if (!isDemoMode()) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <GlassCard className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              🚀 Demo On-Chain
            </h2>
            <p className="text-text-secondary">
              Demuestra las funcionalidades completas de BioShield Insurance
            </p>
          </div>
          <GradientButton 
            onClick={runFullDemo}
            disabled={isRunning}
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            {isRunning ? 'Ejecutando...' : 'Ejecutar Demo'}
          </GradientButton>
        </div>
      </GlassCard>

      {/* Connection Status */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
            <span className="text-sm font-medium text-text-primary">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {isConnected && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-sm text-text-secondary">
                  {getNetworkDisplayName(currentNetwork)}
                </span>
                <span className="text-text-secondary">•</span>
                <span className="text-sm text-text-secondary font-mono">
                  {truncateAddress(address || '')}
                </span>
              </>
            )}
          </div>
          {livesBalance > 0 && (
            <div className="flex items-center space-x-2 text-accent">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {formatNumber(livesBalance)} $LIVES
              </span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Demo Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <GlassCard 
              className={`p-4 transition-all duration-300 ${getStepColor(step.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStepIcon(step.status)}
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {step.description}
                    </p>
                    {step.status === 'error' && step.result && (
                      <p className="text-sm text-error mt-1">
                        Error: {step.result}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {step.status === 'pending' && (
                    <GradientButton 
                      size="sm"
                      onClick={() => runStep(index)}
                      disabled={isRunning}
                    >
                      Ejecutar
                    </GradientButton>
                  )}
                  {step.status === 'completed' && (
                    <div className="flex items-center space-x-2 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Completado</span>
                    </div>
                  )}
                  {step.status === 'error' && (
                    <GradientButton 
                      size="sm"
                      variant="secondary"
                      onClick={() => runStep(index)}
                      disabled={isRunning}
                    >
                      Reintentar
                    </GradientButton>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Demo Results */}
      {policies.length > 0 && (
        <GlassCard className="p-6 bg-gradient-to-r from-success/10 to-primary/10 border border-success/20">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-success" />
            <h3 className="text-lg font-semibold text-text-primary">
              Pólizas Creadas
            </h3>
          </div>
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="font-medium text-text-primary">
                    {policy.id}
                  </div>
                  <div className="text-sm text-text-secondary">
                    Cobertura: {formatCurrency(policy.coverageAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-success">
                    {formatCurrency(policy.premium)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Prima
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Demo Info */}
      <GlassCard className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              Modo Demo
            </h4>
            <p className="text-sm text-text-secondary">
              Este es un demo que simula las transacciones on-chain. 
              En producción, todas las operaciones se ejecutarían en contratos inteligentes reales.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
