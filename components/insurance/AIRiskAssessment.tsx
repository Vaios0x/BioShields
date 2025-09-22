'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { formatCurrency, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AIRiskAssessmentProps {
  documentText?: string
  onRiskScoreCalculated?: (score: number, premium: number) => void
  onClose?: () => void
}

interface RiskFactors {
  clinicalComplexity: number
  regulatoryRisk: number
  marketRisk: number
  technicalRisk: number
  timelineRisk: number
}

interface RiskAnalysis {
  overallScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  factors: RiskFactors
  recommendations: string[]
  premiumMultiplier: number
  confidence: number
}

export function AIRiskAssessment({ documentText, onRiskScoreCalculated, onClose }: AIRiskAssessmentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null)
  const [uploadedDocument, setUploadedDocument] = useState<string>('')
  const [showResults, setShowResults] = useState(false)

  const analyzeDocument = async (text: string) => {
    setIsAnalyzing(true)
    
    try {
      // Simulate AI analysis with realistic data
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock AI analysis results
      const mockAnalysis: RiskAnalysis = {
        overallScore: Math.floor(Math.random() * 40) + 30, // 30-70 range
        riskLevel: Math.random() > 0.5 ? 'medium' : 'high',
        factors: {
          clinicalComplexity: Math.floor(Math.random() * 30) + 20,
          regulatoryRisk: Math.floor(Math.random() * 40) + 15,
          marketRisk: Math.floor(Math.random() * 35) + 10,
          technicalRisk: Math.floor(Math.random() * 25) + 15,
          timelineRisk: Math.floor(Math.random() * 45) + 20
        },
        recommendations: [
          'Consider extending trial timeline by 3-6 months',
          'Implement additional safety monitoring protocols',
          'Prepare contingency plans for regulatory delays',
          'Strengthen data collection and analysis framework'
        ],
        premiumMultiplier: Math.random() * 0.5 + 1.2, // 1.2x - 1.7x
        confidence: Math.floor(Math.random() * 20) + 80 // 80-100%
      }
      
      setAnalysis(mockAnalysis)
      setShowResults(true)
      
      if (onRiskScoreCalculated) {
        const basePremium = 50000
        const adjustedPremium = basePremium * mockAnalysis.premiumMultiplier
        onRiskScoreCalculated(mockAnalysis.overallScore, adjustedPremium)
      }
      
      toast.success('Análisis de riesgo completado')
    } catch (error) {
      toast.error('Error en el análisis de riesgo')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setUploadedDocument(text)
        analyzeDocument(text)
      }
      reader.readAsText(file)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success'
      case 'medium': return 'text-accent'
      case 'high': return 'text-warning'
      case 'very_high': return 'text-danger'
      default: return 'text-text-secondary'
    }
  }

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success/20'
      case 'medium': return 'bg-accent/20'
      case 'high': return 'bg-warning/20'
      case 'very_high': return 'bg-danger/20'
      default: return 'bg-white/10'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-danger'
    if (score >= 60) return 'text-warning'
    if (score >= 40) return 'text-accent'
    return 'text-success'
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              AI Risk Assessment
            </h3>
            <p className="text-text-secondary text-sm">
              Análisis inteligente de riesgo con GPT-4 para optimizar primas
            </p>
          </div>
        </div>

        {!showResults && (
          <div className="space-y-4">
            <div className="text-center p-8 border-2 border-dashed border-white/20 rounded-lg">
              <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Subir Documento de Clinical Trial
              </h4>
              <p className="text-text-secondary mb-4">
                Sube tu protocolo, resultados preliminares o documentación regulatoria
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="document-upload"
              />
              <label
                htmlFor="document-upload"
                className="inline-flex items-center px-6 py-3 bg-primary/20 hover:bg-primary/30 rounded-lg cursor-pointer transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                Seleccionar Archivo
              </label>
            </div>

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-white/5 rounded-lg"
              >
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-text-primary mb-2">
                  Analizando con IA...
                </h4>
                <p className="text-text-secondary text-sm">
                  GPT-4 está procesando tu documento y calculando el riesgo
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Extrayendo datos del protocolo</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Evaluando factores de riesgo</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-accent">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculando score final</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {showResults && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Risk Score */}
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold text-text-primary">
                    Risk Score
                  </div>
                  <div className={`text-sm ${getRiskColor(analysis.riskLevel)}`}>
                    {analysis.riskLevel.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    analysis.overallScore >= 80 ? 'bg-danger' :
                    analysis.overallScore >= 60 ? 'bg-warning' :
                    analysis.overallScore >= 40 ? 'bg-accent' : 'bg-success'
                  }`}
                  style={{ width: `${analysis.overallScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Bajo (0-40)</span>
                <span>Medio (40-60)</span>
                <span>Alto (60-80)</span>
                <span>Muy Alto (80-100)</span>
              </div>
            </div>

            {/* Risk Factors Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-4">
                Desglose de Factores de Riesgo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.factors).map(([factor, score]) => (
                  <div key={factor} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-text-secondary capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          score >= 80 ? 'bg-danger' :
                          score >= 60 ? 'bg-warning' :
                          score >= 40 ? 'bg-accent' : 'bg-success'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Impact */}
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h4 className="text-lg font-semibold text-accent">
                  Impacto en Prima
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Multiplicador:</span>
                  <div className="text-text-primary font-semibold">
                    {analysis.premiumMultiplier.toFixed(2)}x
                  </div>
                </div>
                <div>
                  <span className="text-text-secondary">Confianza IA:</span>
                  <div className="text-text-primary font-semibold">
                    {analysis.confidence}%
                  </div>
                </div>
                <div>
                  <span className="text-text-secondary">Ajuste recomendado:</span>
                  <div className="text-accent font-semibold">
                    +{((analysis.premiumMultiplier - 1) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-4">
                Recomendaciones de IA
              </h4>
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">
                      {recommendation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <GradientButton
                onClick={() => {
                  setShowResults(false)
                  setAnalysis(null)
                }}
                variant="secondary"
              >
                Nuevo Análisis
              </GradientButton>
              <GradientButton>
                <Shield className="w-4 h-4 mr-2" />
                Aplicar a Seguro
              </GradientButton>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  )
}
