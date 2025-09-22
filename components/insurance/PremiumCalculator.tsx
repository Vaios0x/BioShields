'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { X, Calculator, Shield, DollarSign, Zap, CheckCircle, AlertTriangle } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface PremiumCalculatorProps {
  productId: string
  onClose: () => void
}

const productConfigs = {
  clinical_trial: {
    name: 'Seguro de Ensayos Clínicos',
    baseRate: 0.05, // 5% of coverage
    minCoverage: 100000,
    maxCoverage: 500000,
    livesDiscount: 0.5,
    riskFactors: {
      phase: { II: 1.0, III: 1.2 },
      indication: { oncology: 1.3, neurology: 1.1, cardiology: 1.0, other: 0.9 },
      duration: { '6m': 0.8, '12m': 1.0, '18m': 1.2, '24m': 1.4 }
    }
  },
  research_funding: {
    name: 'Seguro de Financiación',
    baseRate: 0.05,
    minCoverage: 200000,
    maxCoverage: 1000000,
    livesDiscount: 0.5,
    riskFactors: {
      source: { government: 0.8, private: 1.0, foundation: 1.2 },
      stage: { early: 1.3, mid: 1.0, late: 0.8 },
      duration: { '6m': 0.7, '12m': 1.0, '18m': 1.3, '24m': 1.6 }
    }
  },
  ip_protection: {
    name: 'Protección de IP',
    baseRate: 0.04,
    minCoverage: 500000,
    maxCoverage: 2000000,
    livesDiscount: 0.5,
    riskFactors: {
      type: { patent: 1.0, trademark: 0.8, copyright: 0.6 },
      jurisdiction: { us: 1.0, eu: 1.1, global: 1.3 },
      duration: { '12m': 1.0, '24m': 1.8, '36m': 2.5 }
    }
  },
  regulatory_approval: {
    name: 'Aprobación Regulatoria',
    baseRate: 0.04,
    minCoverage: 1000000,
    maxCoverage: 3000000,
    livesDiscount: 0.5,
    riskFactors: {
      agency: { fda: 1.0, ema: 1.1, both: 1.3 },
      indication: { orphan: 0.8, standard: 1.0, breakthrough: 1.2 },
      duration: { '12m': 1.0, '18m': 1.4, '24m': 1.8 }
    }
  }
}

export function PremiumCalculator({ productId, onClose }: PremiumCalculatorProps) {
  const [coverageAmount, setCoverageAmount] = useState(0)
  const [riskFactors, setRiskFactors] = useState<Record<string, string>>({})
  const [payWithLives, setPayWithLives] = useState(false)
  const [calculatedPremium, setCalculatedPremium] = useState(0)
  const [discountedPremium, setDiscountedPremium] = useState(0)
  const [savings, setSavings] = useState(0)

  const config = productConfigs[productId as keyof typeof productConfigs]

  useEffect(() => {
    if (config && coverageAmount > 0) {
      calculatePremium()
    }
  }, [coverageAmount, riskFactors, payWithLives, config])

  const calculatePremium = () => {
    if (!config || coverageAmount === 0) return

    let premium = coverageAmount * config.baseRate

    // Apply risk factors
    Object.entries(riskFactors).forEach(([factor, value]) => {
      const riskFactor = config.riskFactors[factor as keyof typeof config.riskFactors]
      if (riskFactor && typeof riskFactor === 'object') {
        const multiplier = (riskFactor as Record<string, number>)[value as string]
        if (multiplier) {
          premium *= multiplier
        }
      }
    })

    setCalculatedPremium(premium)

    if (payWithLives) {
      const discount = premium * config.livesDiscount
      setDiscountedPremium(premium - discount)
      setSavings(discount)
    } else {
      setDiscountedPremium(premium)
      setSavings(0)
    }
  }

  const handleRiskFactorChange = (factor: string, value: string) => {
    setRiskFactors((prev: Record<string, string>) => ({
      ...prev,
      [factor]: value
    }))
  }

  const getRiskFactorOptions = (factor: string) => {
    if (!config) return []
    return Object.keys(config.riskFactors[factor as keyof typeof config.riskFactors] || {})
  }

  const getRiskFactorLabel = (factor: string) => {
    const labels: Record<string, string> = {
      phase: 'Fase del Ensayo',
      indication: 'Indicación',
      duration: 'Duración',
      source: 'Fuente de Financiación',
      stage: 'Etapa del Proyecto',
      type: 'Tipo de IP',
      jurisdiction: 'Jurisdicción',
      agency: 'Agencia Regulatoria'
    }
    return labels[factor] || factor
  }

  const getOptionLabel = (factor: string, option: string) => {
    const labels: Record<string, Record<string, string>> = {
      phase: { II: 'Fase II', III: 'Fase III' },
      indication: { 
        oncology: 'Oncología', 
        neurology: 'Neurología', 
        cardiology: 'Cardiología', 
        other: 'Otras' 
      },
      duration: { '6m': '6 meses', '12m': '12 meses', '18m': '18 meses', '24m': '24 meses' },
      source: { government: 'Gobierno', private: 'Privado', foundation: 'Fundación' },
      stage: { early: 'Temprana', mid: 'Media', late: 'Tardía' },
      type: { patent: 'Patente', trademark: 'Marca', copyright: 'Copyright' },
      jurisdiction: { us: 'Estados Unidos', eu: 'Unión Europea', global: 'Global' },
      agency: { fda: 'FDA', ema: 'EMA', both: 'FDA + EMA' }
    }
    return labels[factor]?.[option] || option
  }

  if (!config) {
    return (
      <GlassCard 
        className="p-8"
        children={
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Producto no encontrado
            </h3>
            <p className="text-text-secondary mb-6">
              El producto seleccionado no está disponible
            </p>
            <GradientButton onClick={onClose}>
              Cerrar
            </GradientButton>
          </div>
        }
      />
    )
  }

  return (
    <GlassCard 
      className="p-8 max-h-[90vh] overflow-y-auto"
      children={
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-text-primary">
                Calculadora de Prima
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

      <div className="space-y-6">
        {/* Product Info */}
        <div className="text-center p-4 bg-white/5 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {config.name}
          </h3>
          <p className="text-text-secondary text-sm">
            Cobertura: {formatCurrency(config.minCoverage)} - {formatCurrency(config.maxCoverage)}
          </p>
        </div>

        {/* Coverage Amount */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Monto de Cobertura
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input
              type="number"
              value={coverageAmount || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCoverageAmount(Number(e.target.value))}
              placeholder="Ingresa el monto de cobertura"
              min={config.minCoverage}
              max={config.maxCoverage}
              step="10000"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Rango: {formatCurrency(config.minCoverage)} - {formatCurrency(config.maxCoverage)}
          </p>
        </div>

        {/* Risk Factors */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Factores de Riesgo
          </h4>
          <div className="space-y-4">
            {Object.keys(config.riskFactors).map((factor) => (
              <div key={factor}>
                <label className="block text-sm text-text-secondary mb-2">
                  {getRiskFactorLabel(factor)}
                </label>
                <select
                  value={riskFactors[factor] || ''}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleRiskFactorChange(factor, e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Selecciona una opción</option>
                  {getRiskFactorOptions(factor).map((option) => (
                    <option key={option} value={option}>
                      {getOptionLabel(factor, option)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Método de Pago
          </h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="payment"
                checked={!payWithLives}
                onChange={() => setPayWithLives(false)}
                className="w-4 h-4 text-primary bg-white/5 border-white/10 focus:ring-primary/50"
              />
              <span className="text-text-primary">Pago tradicional (USDC)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="payment"
                checked={payWithLives}
                onChange={() => setPayWithLives(true)}
                className="w-4 h-4 text-primary bg-white/5 border-white/10 focus:ring-primary/50"
              />
              <div className="flex items-center space-x-2">
                <span className="text-text-primary">Pago con $LIVES</span>
                <div className="flex items-center space-x-1 text-accent text-sm font-semibold">
                  <Zap className="w-4 h-4" />
                  <span>50% descuento</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Calculation Results */}
        {calculatedPremium > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 bg-white/5 rounded-lg"
          >
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Cálculo de Prima
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Prima base:</span>
                <span className="text-text-primary font-semibold">
                  {formatCurrency(calculatedPremium)}
                </span>
              </div>
              
              {payWithLives && savings > 0 && (
                <>
                  <div className="flex justify-between items-center text-accent">
                    <span>Descuento $LIVES (50%):</span>
                    <span className="font-semibold">-{formatCurrency(savings)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-semibold">Prima final:</span>
                      <span className="text-success text-lg font-bold">
                        {formatCurrency(discountedPremium)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              {!payWithLives && (
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-primary font-semibold">Prima final:</span>
                    <span className="text-text-primary text-lg font-bold">
                      {formatCurrency(calculatedPremium)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {payWithLives && (
              <div className="flex items-center space-x-2 text-accent text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Ahorras {formatCurrency(savings)} con $LIVES</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <GradientButton
            fullWidth
            onClick={() => {
              // Navigate to purchase flow
              console.log('Purchase with:', { coverageAmount, riskFactors, payWithLives, premium: discountedPremium })
            }}
            disabled={!coverageAmount || calculatedPremium === 0}
          >
            <Shield className="w-4 h-4 mr-2" />
            Comprar Seguro
          </GradientButton>
          
          <GradientButton
            fullWidth
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </GradientButton>
        </div>
      </div>
        </>
      }
    />
  )
}
