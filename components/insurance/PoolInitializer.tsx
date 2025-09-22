'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useInsurancePool } from '@/hooks/useInsurancePool'
import { POOL_CONFIG, ORACLE_CONFIG } from '@/lib/solana/config'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Settings, Shield, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import BN from 'bn.js'
import toast from 'react-hot-toast'

interface PoolInitializerProps {
  onPoolInitialized?: (poolAddress: PublicKey) => void
}

export function PoolInitializer({ onPoolInitialized }: PoolInitializerProps) {
  const {
    initializePool,
    loading,
    connected,
    checkPoolExists,
    isPoolAuthority
  } = useInsurancePool()

  const [formData, setFormData] = useState({
    livesTokenMint: '',
    shieldTokenMint: '',
    feeBasisPoints: POOL_CONFIG.DEFAULT_FEE_BASIS_POINTS,
    minCoverageAmount: POOL_CONFIG.MIN_COVERAGE_AMOUNT / 1_000_000_000, // En SOL
    maxCoverageAmount: POOL_CONFIG.MAX_COVERAGE_AMOUNT / 1_000_000_000, // En SOL
    oracleAddress: ORACLE_CONFIG.PYTH_PROGRAM_ID.toString(),
  })

  const [step, setStep] = useState<'check' | 'form' | 'confirm'>('check')
  const [poolExists, setPoolExists] = useState<boolean | null>(null)

  // Verificar si el pool ya existe
  const handleCheckPool = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      const exists = await checkPoolExists()
      setPoolExists(exists)

      if (exists) {
        toast.info('Insurance pool already exists')
        setStep('confirm')
      } else {
        setStep('form')
      }
    } catch (error) {
      console.error('Error checking pool:', error)
      toast.error('Failed to check pool status')
    }
  }

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Validar formulario
  const validateForm = (): boolean => {
    try {
      // Validar direcciones de tokens
      new PublicKey(formData.livesTokenMint)
      new PublicKey(formData.shieldTokenMint)
      new PublicKey(formData.oracleAddress)

      // Validar rangos
      if (formData.feeBasisPoints < 0 || formData.feeBasisPoints > 10000) {
        toast.error('Fee basis points must be between 0 and 10000')
        return false
      }

      if (formData.minCoverageAmount <= 0) {
        toast.error('Minimum coverage amount must be positive')
        return false
      }

      if (formData.maxCoverageAmount <= formData.minCoverageAmount) {
        toast.error('Maximum coverage amount must be greater than minimum')
        return false
      }

      return true
    } catch (error) {
      toast.error('Invalid public key format')
      return false
    }
  }

  // Inicializar el pool
  const handleInitializePool = async () => {
    if (!validateForm()) return

    try {
      const result = await initializePool({
        livesTokenMint: new PublicKey(formData.livesTokenMint),
        shieldTokenMint: new PublicKey(formData.shieldTokenMint),
        feeBasisPoints: formData.feeBasisPoints,
        minCoverageAmount: new BN(formData.minCoverageAmount * 1_000_000_000),
        maxCoverageAmount: new BN(formData.maxCoverageAmount * 1_000_000_000),
        oracleAddress: new PublicKey(formData.oracleAddress),
      })

      setStep('confirm')
      onPoolInitialized?.(result.poolAddress)

    } catch (error) {
      console.error('Error initializing pool:', error)
    }
  }

  if (!connected) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Wallet Not Connected
        </h3>
        <p className="text-text-secondary mb-6">
          Please connect your wallet to initialize the insurance pool
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Insurance Pool Setup
        </h2>
        <p className="text-text-secondary">
          Initialize the BioShields insurance pool with your parameters
        </p>
      </div>

      {/* Step 1: Check Pool Status */}
      {step === 'check' && (
        <GlassCard className="p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-4">
              Check Pool Status
            </h3>
            <p className="text-text-secondary mb-6">
              First, let's check if an insurance pool already exists for your wallet
            </p>
            <GradientButton
              onClick={handleCheckPool}
              loading={loading}
              size="lg"
            >
              Check Pool Status
            </GradientButton>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Configuration Form */}
      {step === 'form' && (
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <DollarSign className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">
                Pool Configuration
              </h3>
            </div>

            {/* Token Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  LIVES Token Mint Address *
                </label>
                <input
                  type="text"
                  value={formData.livesTokenMint}
                  onChange={(e) => handleInputChange('livesTokenMint', e.target.value)}
                  placeholder="Enter LIVES token mint address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  SHIELD Token Mint Address *
                </label>
                <input
                  type="text"
                  value={formData.shieldTokenMint}
                  onChange={(e) => handleInputChange('shieldTokenMint', e.target.value)}
                  placeholder="Enter SHIELD token mint address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Pool Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Pool Fee (Basis Points)
                </label>
                <input
                  type="number"
                  value={formData.feeBasisPoints}
                  onChange={(e) => handleInputChange('feeBasisPoints', parseInt(e.target.value))}
                  min="0"
                  max="10000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {(formData.feeBasisPoints / 100).toFixed(2)}% fee
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Min Coverage (SOL)
                </label>
                <input
                  type="number"
                  value={formData.minCoverageAmount}
                  onChange={(e) => handleInputChange('minCoverageAmount', parseFloat(e.target.value))}
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Coverage (SOL)
                </label>
                <input
                  type="number"
                  value={formData.maxCoverageAmount}
                  onChange={(e) => handleInputChange('maxCoverageAmount', parseFloat(e.target.value))}
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Oracle Configuration */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Oracle Address *
              </label>
              <input
                type="text"
                value={formData.oracleAddress}
                onChange={(e) => handleInputChange('oracleAddress', e.target.value)}
                placeholder="Enter oracle program address"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-text-secondary mt-1">
                Default: Pyth Oracle Program
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => setStep('check')}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                Back
              </button>
              <GradientButton
                onClick={handleInitializePool}
                loading={loading}
                className="flex-1"
              >
                Initialize Pool
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <GlassCard className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {poolExists ? 'Pool Already Exists' : 'Pool Initialized Successfully!'}
            </h3>
            <p className="text-text-secondary mb-6">
              {poolExists
                ? 'An insurance pool is already configured for your wallet'
                : 'Your BioShields insurance pool is now ready to accept coverages and manage claims'
              }
            </p>
            <div className="flex justify-center space-x-4">
              <GradientButton
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Continue to Dashboard
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}