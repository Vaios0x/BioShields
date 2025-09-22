'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react'

interface DemoProgressProps {
  currentStep: number
  isRunning: boolean
  showLivesDiscount: boolean
}

const DEMO_STEPS = [
  {
    id: 1,
    title: "Create Coverage",
    description: "Deploy insurance policy on blockchain",
    duration: "2s",
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Oracle Detection",
    description: "Chainlink oracle detects trial failure",
    duration: "3s",
    icon: <AlertCircle className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Auto Claim",
    description: "Automatic claim submission triggered",
    duration: "2s",
    icon: <Clock className="w-5 h-5" />
  },
  {
    id: 4,
    title: "Instant Payout",
    description: "Smart contract executes payout",
    duration: "1s",
    icon: <CheckCircle className="w-5 h-5" />
  }
]

export function DemoProgress({ currentStep, isRunning, showLivesDiscount }: DemoProgressProps) {
  const getStepStatus = (stepId: number) => {
    if (currentStep > stepId) return 'completed'
    if (currentStep === stepId) return 'active'
    return 'pending'
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500'
      case 'active':
        return 'bg-blue-500 border-blue-500 animate-pulse'
      default:
        return 'bg-gray-600 border-gray-600'
    }
  }

  const getStepIcon = (status: string, icon: React.ReactNode) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-white" />
    }
    return icon
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Demo Progress
        </h3>
        <p className="text-gray-400 text-sm">
          Real-time insurance claim processing
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_STEPS.map((step, index) => {
          const status = getStepStatus(step.id)
          const isActive = status === 'active'
          const isCompleted = status === 'completed'

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-4 transition-all duration-300 ${
                isActive ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getStepColor(status)}`}>
                  {getStepIcon(status, step.icon)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold ${
                      isCompleted ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    {step.description}
                  </p>
                  
                  {isActive && isRunning && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: 'easeInOut' }}
                      className="h-1 bg-blue-500 rounded-full mt-2"
                    />
                  )}
                </div>
              </div>

              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-2 bg-green-500/10 rounded-lg border border-green-500/20"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Overall Progress</span>
          <span className="text-sm text-gray-400">
            {Math.round((currentStep / DEMO_STEPS.length) * 100)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / DEMO_STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Live Status */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold text-blue-400">
                  Demo Running
                </h4>
                <p className="text-xs text-gray-400">
                  Processing step {currentStep} of {DEMO_STEPS.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVES Discount Indicator */}
      {showLivesDiscount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-accent/10 border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-400">
                $LIVES Discount Active
              </h4>
              <p className="text-xs text-gray-400">
                50% discount applied to premium
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
