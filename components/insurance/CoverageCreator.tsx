'use client'

import { useState, useEffect } from 'react'
import { useCoverage } from '@/hooks/useCoverage'
import { useInsurancePool } from '@/hooks/useInsurancePool'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { CoverageType, RiskCategory, TriggerConditions, CustomCondition, ComparisonOperator } from '@/lib/solana/types'
import { Shield, DollarSign, Clock, AlertCircle, Plus, Trash2, Info } from 'lucide-react'
import BN from 'bn.js'
import toast from 'react-hot-toast'

interface CoverageCreatorProps {
  onCoverageCreated?: (coverageAddress: string) => void
}

export function CoverageCreator({ onCoverageCreated }: CoverageCreatorProps) {
  const { createCoverage, calculatePremium, loading, connected } = useCoverage()
  const { poolData } = useInsurancePool()

  const [formData, setFormData] = useState({
    coverageAmount: 10000, // En USD
    coveragePeriod: 365, // En días
    coverageType: CoverageType.ClinicalTrialFailure,
    riskCategory: RiskCategory.Medium,
    metadataUri: '',
    useTokenPayment: false,
    livesTokenMint: '',
    // Trigger conditions
    clinicalTrialFailure: true,
    regulatoryRejection: false,
    ipInvalidation: false,
    minimumThreshold: 1000,
    customConditions: [] as CustomCondition[],
  })

  const [calculatedPremium, setCalculatedPremium] = useState<BN>(new BN(0))
  const [step, setStep] = useState<'basic' | 'conditions' | 'review' | 'success'>('basic')

  // Calcular prima automáticamente cuando cambien los parámetros
  useEffect(() => {
    if (formData.coverageAmount > 0 && formData.coveragePeriod > 0) {
      const coverageAmountBN = new BN(formData.coverageAmount * 1_000_000_000) // Convertir a lamports
      const periodInSeconds = formData.coveragePeriod * 24 * 60 * 60

      const premium = calculatePremium(
        coverageAmountBN,
        periodInSeconds,
        formData.riskCategory,
        formData.useTokenPayment
      )

      setCalculatedPremium(premium)
    }
  }, [
    formData.coverageAmount,
    formData.coveragePeriod,
    formData.riskCategory,
    formData.useTokenPayment,
    calculatePremium
  ])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addCustomCondition = () => {
    const newCondition: CustomCondition = {
      conditionType: '',
      threshold: new BN(0),
      operator: ComparisonOperator.GreaterThan,
    }

    setFormData(prev => ({
      ...prev,
      customConditions: [...prev.customConditions, newCondition]
    }))
  }

  const removeCustomCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customConditions: prev.customConditions.filter((_, i) => i !== index)
    }))
  }

  const updateCustomCondition = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customConditions: prev.customConditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }))
  }

  const validateBasicInfo = (): boolean => {
    if (formData.coverageAmount <= 0) {
      toast.error('Coverage amount must be positive')
      return false
    }

    if (formData.coveragePeriod <= 0) {
      toast.error('Coverage period must be positive')
      return false
    }

    if (poolData) {
      const coverageAmountLamports = formData.coverageAmount * 1_000_000_000
      if (coverageAmountLamports < poolData.minCoverageAmount.toNumber()) {
        toast.error(`Coverage amount must be at least ${poolData.minCoverageAmount.toNumber() / 1_000_000_000} SOL`)
        return false
      }

      if (coverageAmountLamports > poolData.maxCoverageAmount.toNumber()) {
        toast.error(`Coverage amount cannot exceed ${poolData.maxCoverageAmount.toNumber() / 1_000_000_000} SOL`)
        return false
      }
    }

    return true
  }

  const validateConditions = (): boolean => {
    if (!formData.clinicalTrialFailure && !formData.regulatoryRejection && !formData.ipInvalidation) {
      toast.error('At least one trigger condition must be selected')
      return false
    }

    for (const condition of formData.customConditions) {
      if (!condition.conditionType.trim()) {
        toast.error('All custom conditions must have a type')
        return false
      }
    }

    return true
  }

  const handleCreateCoverage = async () => {
    if (!validateBasicInfo() || !validateConditions()) return

    try {
      const triggerConditions: TriggerConditions = {
        clinicalTrialFailure: formData.clinicalTrialFailure,
        regulatoryRejection: formData.regulatoryRejection,
        ipInvalidation: formData.ipInvalidation,
        minimumThreshold: new BN(formData.minimumThreshold),
        customConditions: formData.customConditions,
      }

      const result = await createCoverage({
        coverageAmount: new BN(formData.coverageAmount * 1_000_000_000),
        coveragePeriod: formData.coveragePeriod * 24 * 60 * 60,
        coverageType: formData.coverageType,
        riskCategory: formData.riskCategory,
        triggerConditions,
        metadataUri: formData.metadataUri || `ipfs://bioshield-coverage-${Date.now()}`,
        useTokenPayment: formData.useTokenPayment,
        livesTokenMint: formData.livesTokenMint ? new PublicKey(formData.livesTokenMint) : undefined,
      })

      setStep('success')
      onCoverageCreated?.(result.coverageAddress.toString())

    } catch (error) {
      console.error('Error creating coverage:', error)
    }
  }

  if (!connected) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Wallet Not Connected
        </h3>
        <p className="text-text-secondary">
          Please connect your wallet to create insurance coverage
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {['basic', 'conditions', 'review', 'success'].map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepName
                ? 'bg-primary text-white'
                : index < ['basic', 'conditions', 'review', 'success'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-text-secondary'
            }`}>
              {index + 1}
            </div>
            {index < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${
                index < ['basic', 'conditions', 'review', 'success'].indexOf(step)
                  ? 'bg-green-500'
                  : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 'basic' && (
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">
                Basic Coverage Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Coverage Amount (SOL)
                </label>
                <input
                  type="number"
                  value={formData.coverageAmount}
                  onChange={(e) => handleInputChange('coverageAmount', parseFloat(e.target.value))}
                  min="0"
                  step="1"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Coverage Period (Days)
                </label>
                <input
                  type="number"
                  value={formData.coveragePeriod}
                  onChange={(e) => handleInputChange('coveragePeriod', parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Coverage Type
                </label>
                <select
                  value={formData.coverageType}
                  onChange={(e) => handleInputChange('coverageType', e.target.value as CoverageType)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={CoverageType.ClinicalTrialFailure}>Clinical Trial Failure</option>
                  <option value={CoverageType.RegulatoryRejection}>Regulatory Rejection</option>
                  <option value={CoverageType.IpInvalidation}>IP Invalidation</option>
                  <option value={CoverageType.ResearchInfrastructure}>Research Infrastructure</option>
                  <option value={CoverageType.Custom}>Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Risk Category
                </label>
                <select
                  value={formData.riskCategory}
                  onChange={(e) => handleInputChange('riskCategory', e.target.value as RiskCategory)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={RiskCategory.Low}>Low Risk</option>
                  <option value={RiskCategory.Medium}>Medium Risk</option>
                  <option value={RiskCategory.High}>High Risk</option>
                  <option value={RiskCategory.VeryHigh}>Very High Risk</option>
                </select>
              </div>
            </div>

            {/* Premium Calculation */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-text-primary">Estimated Premium</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-500">
                    {(calculatedPremium.toNumber() / 1_000_000_000).toFixed(4)} SOL
                  </div>
                  {formData.useTokenPayment && (
                    <div className="text-sm text-text-secondary">
                      (50% discount with LIVES tokens)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="useTokenPayment"
                  checked={formData.useTokenPayment}
                  onChange={(e) => handleInputChange('useTokenPayment', e.target.checked)}
                  className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary/50"
                />
                <label htmlFor="useTokenPayment" className="text-text-primary">
                  Pay with LIVES tokens (50% discount)
                </label>
              </div>

              {formData.useTokenPayment && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    LIVES Token Mint Address
                  </label>
                  <input
                    type="text"
                    value={formData.livesTokenMint}
                    onChange={(e) => handleInputChange('livesTokenMint', e.target.value)}
                    placeholder="Enter LIVES token mint address"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <GradientButton
                onClick={() => {
                  if (validateBasicInfo()) setStep('conditions')
                }}
              >
                Next: Trigger Conditions
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Trigger Conditions */}
      {step === 'conditions' && (
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <AlertCircle className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">
                Trigger Conditions
              </h3>
            </div>

            {/* Standard Conditions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-text-primary">Standard Conditions</h4>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="clinicalTrialFailure"
                    checked={formData.clinicalTrialFailure}
                    onChange={(e) => handleInputChange('clinicalTrialFailure', e.target.checked)}
                    className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary/50"
                  />
                  <label htmlFor="clinicalTrialFailure" className="text-text-primary">
                    Clinical Trial Failure
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="regulatoryRejection"
                    checked={formData.regulatoryRejection}
                    onChange={(e) => handleInputChange('regulatoryRejection', e.target.checked)}
                    className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary/50"
                  />
                  <label htmlFor="regulatoryRejection" className="text-text-primary">
                    Regulatory Rejection (FDA/EMA)
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="ipInvalidation"
                    checked={formData.ipInvalidation}
                    onChange={(e) => handleInputChange('ipInvalidation', e.target.checked)}
                    className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary/50"
                  />
                  <label htmlFor="ipInvalidation" className="text-text-primary">
                    IP Invalidation
                  </label>
                </div>
              </div>
            </div>

            {/* Minimum Threshold */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Minimum Threshold (USD)
              </label>
              <input
                type="number"
                value={formData.minimumThreshold}
                onChange={(e) => handleInputChange('minimumThreshold', parseInt(e.target.value))}
                min="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Custom Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-text-primary">Custom Conditions</h4>
                <button
                  onClick={addCustomCondition}
                  className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Condition</span>
                </button>
              </div>

              {formData.customConditions.map((condition, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <input
                      type="text"
                      value={condition.conditionType}
                      onChange={(e) => updateCustomCondition(index, 'conditionType', e.target.value)}
                      placeholder="Condition type"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCustomCondition(index, 'operator', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value={ComparisonOperator.GreaterThan}>Greater Than</option>
                      <option value={ComparisonOperator.LessThan}>Less Than</option>
                      <option value={ComparisonOperator.Equal}>Equal</option>
                      <option value={ComparisonOperator.NotEqual}>Not Equal</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      value={condition.threshold.toNumber()}
                      onChange={(e) => updateCustomCondition(index, 'threshold', new BN(parseInt(e.target.value) || 0))}
                      placeholder="Threshold"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-text-primary placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => removeCustomCondition(index)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('basic')}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                Back
              </button>
              <GradientButton
                onClick={() => {
                  if (validateConditions()) setStep('review')
                }}
              >
                Next: Review
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Info className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">
                Review Coverage Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-text-secondary">Coverage Amount:</span>
                  <span className="ml-2 font-semibold text-text-primary">
                    {formData.coverageAmount} SOL
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Period:</span>
                  <span className="ml-2 font-semibold text-text-primary">
                    {formData.coveragePeriod} days
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Type:</span>
                  <span className="ml-2 font-semibold text-text-primary">
                    {formData.coverageType}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Risk Category:</span>
                  <span className="ml-2 font-semibold text-text-primary">
                    {formData.riskCategory}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-text-secondary">Premium:</span>
                  <span className="ml-2 font-semibold text-green-500">
                    {(calculatedPremium.toNumber() / 1_000_000_000).toFixed(4)} SOL
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Payment Method:</span>
                  <span className="ml-2 font-semibold text-text-primary">
                    {formData.useTokenPayment ? 'LIVES Tokens' : 'SOL'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-yellow-200 font-medium">Important Notice</span>
              </div>
              <p className="text-yellow-100 mt-2 text-sm">
                By creating this coverage, you agree to pay the premium upfront.
                Claims will be processed automatically based on oracle data verification.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('conditions')}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                Back
              </button>
              <GradientButton
                onClick={handleCreateCoverage}
                loading={loading}
                size="lg"
              >
                Create Coverage
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <GlassCard className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-4">
              Coverage Created Successfully!
            </h3>
            <p className="text-text-secondary mb-6">
              Your BioShields insurance coverage is now active and will be monitored automatically
            </p>
            <div className="flex justify-center space-x-4">
              <GradientButton
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                View My Coverages
              </GradientButton>
              <GradientButton
                onClick={() => {
                  setStep('basic')
                  // Reset form
                  setFormData({
                    coverageAmount: 10000,
                    coveragePeriod: 365,
                    coverageType: CoverageType.ClinicalTrialFailure,
                    riskCategory: RiskCategory.Medium,
                    metadataUri: '',
                    useTokenPayment: false,
                    livesTokenMint: '',
                    clinicalTrialFailure: true,
                    regulatoryRejection: false,
                    ipInvalidation: false,
                    minimumThreshold: 1000,
                    customConditions: [],
                  })
                }}
              >
                Create Another Coverage
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}