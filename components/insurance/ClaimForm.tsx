'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Shield,
  ExternalLink,
  Hash
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ClaimFormProps {
  policyId?: string | null
  onClose: () => void
}

interface FormData {
  policyId: string
  claimAmount: number
  description: string
  evidence: File[]
  triggerEvent: string
  additionalInfo: string
}

interface UploadedFile {
  file: File
  hash: string
  url: string
  uploaded: boolean
}

export function ClaimForm({ policyId, onClose }: ClaimFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    policyId: policyId || '',
    claimAmount: 0,
    description: '',
    evidence: [],
    triggerEvent: '',
    additionalInfo: ''
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    claimId?: string
    txHash?: string
    message: string
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps = [
    { id: 1, title: 'Información del Claim', description: 'Detalles básicos del claim' },
    { id: 2, title: 'Evidencia', description: 'Subir documentos de soporte' },
    { id: 3, title: 'Revisión', description: 'Verificar información antes de enviar' },
    { id: 4, title: 'Confirmación', description: 'Claim enviado exitosamente' }
  ]

  const mockPolicies = [
    {
      id: 'BS-001',
      name: 'Ensayo Clínico Fase II - Cáncer',
      type: 'clinical_trial',
      coverageAmount: 500000,
      status: 'active'
    },
    {
      id: 'BS-002',
      name: 'Proyecto de Investigación - Alzheimer',
      type: 'research_funding',
      coverageAmount: 1000000,
      status: 'active'
    },
    {
      id: 'BS-003',
      name: 'Patente - Terapia Genética',
      type: 'ip_protection',
      coverageAmount: 2000000,
      status: 'active'
    }
  ]

  const selectedPolicy = mockPolicies.find(p => p.id === formData.policyId)

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    
    try {
      const newFiles: UploadedFile[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Simulate IPFS upload
        const hash = `Qm${Math.random().toString(36).substr(2, 44)}`
        const url = `https://ipfs.io/ipfs/${hash}`
        
        newFiles.push({
          file,
          hash,
          url,
          uploaded: true
        })
      }
      
      setUploadedFiles(prev => [...prev, ...newFiles])
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, ...Array.from(files)]
      }))
      
      toast.success(`${files.length} archivo(s) subido(s) exitosamente`)
    } catch (error) {
      toast.error('Error al subir archivos')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Simulate claim submission
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const claimId = `CL-${Date.now().toString(36).toUpperCase()}`
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      setSubmissionResult({
        success: true,
        claimId,
        txHash,
        message: 'Claim enviado exitosamente. Será procesado automáticamente por los oracles.'
      })
      
      setCurrentStep(4)
      toast.success('Claim enviado exitosamente')
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: 'Error al enviar el claim. Por favor, inténtalo de nuevo.'
      })
      toast.error('Error al enviar el claim')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.policyId && formData.claimAmount > 0 && formData.description && formData.triggerEvent
      case 2:
        return uploadedFiles.length > 0
      case 3:
        return true
      default:
        return false
    }
  }

  return (
    <GlassCard className="p-8 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">
            Nuevo Claim
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                currentStep >= step.id
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-text-secondary'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <div className={`text-sm font-semibold ${
                  currentStep >= step.id ? 'text-text-primary' : 'text-text-secondary'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-text-secondary">
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Claim Information */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h3 className="text-lg font-semibold text-text-primary">
            Información del Claim
          </h3>

          {/* Policy Selection */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Póliza
            </label>
            <select
              value={formData.policyId}
              onChange={(e) => setFormData(prev => ({ ...prev, policyId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecciona una póliza</option>
              {mockPolicies.filter(p => p.status === 'active').map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name} - {formatCurrency(policy.coverageAmount)}
                </option>
              ))}
            </select>
          </div>

          {/* Claim Amount */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Monto del Claim
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.claimAmount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, claimAmount: Number(e.target.value) }))}
                placeholder="Ingresa el monto del claim"
                max={selectedPolicy?.coverageAmount}
                className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {selectedPolicy && (
              <p className="text-xs text-text-secondary mt-1">
                Máximo: {formatCurrency(selectedPolicy.coverageAmount)}
              </p>
            )}
          </div>

          {/* Trigger Event */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Evento Desencadenante
            </label>
            <input
              type="text"
              value={formData.triggerEvent}
              onChange={(e) => setFormData(prev => ({ ...prev, triggerEvent: e.target.value }))}
              placeholder="Describe el evento que desencadenó el claim"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Descripción Detallada
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Proporciona una descripción detallada del claim..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Información Adicional (Opcional)
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              placeholder="Cualquier información adicional relevante..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </motion.div>
      )}

      {/* Step 2: Evidence Upload */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h3 className="text-lg font-semibold text-text-primary">
            Evidencia y Documentación
          </h3>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-text-primary mb-2">
              Subir Evidencia
            </h4>
            <p className="text-text-secondary mb-4">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-text-secondary">
              PDF, DOC, DOCX, JPG, PNG (máx. 10MB por archivo)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">
                Archivos Subidos ({uploadedFiles.length})
              </h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-text-secondary" />
                      <div>
                        <div className="text-sm text-text-primary font-medium">
                          {file.file.name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.uploaded && (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="text-text-secondary hover:text-danger transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="flex items-center justify-center space-x-2 text-accent">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Subiendo archivos...</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h3 className="text-lg font-semibold text-text-primary">
            Revisión del Claim
          </h3>

          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-text-secondary text-sm">Póliza:</span>
                <div className="text-text-primary font-semibold">
                  {selectedPolicy?.name}
                </div>
              </div>
              <div>
                <span className="text-text-secondary text-sm">Monto:</span>
                <div className="text-text-primary font-semibold">
                  {formatCurrency(formData.claimAmount)}
                </div>
              </div>
              <div>
                <span className="text-text-secondary text-sm">Evento:</span>
                <div className="text-text-primary font-semibold">
                  {formData.triggerEvent}
                </div>
              </div>
              <div>
                <span className="text-text-secondary text-sm">Archivos:</span>
                <div className="text-text-primary font-semibold">
                  {uploadedFiles.length} archivo(s)
                </div>
              </div>
            </div>
            
            <div>
              <span className="text-text-secondary text-sm">Descripción:</span>
              <div className="text-text-primary mt-1">
                {formData.description}
              </div>
            </div>

            {formData.additionalInfo && (
              <div>
                <span className="text-text-secondary text-sm">Información Adicional:</span>
                <div className="text-text-primary mt-1">
                  {formData.additionalInfo}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-accent mb-1">
                  Importante
                </h4>
                <p className="text-sm text-text-secondary">
                  Una vez enviado, el claim será verificado automáticamente por los oracles. 
                  El proceso puede tomar entre 24-48 horas. Recibirás una notificación 
                  cuando el claim sea procesado.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 4 && submissionResult && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 text-center"
        >
          {submissionResult.success ? (
            <>
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                ¡Claim Enviado Exitosamente!
              </h3>
              <p className="text-text-secondary mb-6">
                {submissionResult.message}
              </p>
              
              <div className="space-y-4 p-4 bg-white/5 rounded-lg text-left">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">ID del Claim:</span>
                  <span className="text-text-primary font-semibold">
                    {submissionResult.claimId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Transacción:</span>
                  <a
                    href={`https://basescan.org/tx/${submissionResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Hash className="w-4 h-4" />
                    <span>{submissionResult.txHash?.slice(0, 10)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-danger" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                Error al Enviar Claim
              </h3>
              <p className="text-text-secondary mb-6">
                {submissionResult.message}
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          <GradientButton
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Anterior
          </GradientButton>
          
          {currentStep === 3 ? (
            <GradientButton
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!isStepValid(currentStep)}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Claim'}
            </GradientButton>
          ) : (
            <GradientButton
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
            >
              Siguiente
            </GradientButton>
          )}
        </div>
      )}

      {currentStep === 4 && (
        <div className="flex justify-center pt-6 border-t border-white/10">
          <GradientButton onClick={onClose}>
            Cerrar
          </GradientButton>
        </div>
      )}
    </GlassCard>
  )
}
