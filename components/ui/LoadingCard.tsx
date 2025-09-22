'use client'

import { GlassCard } from './GlassCard'
import { motion } from 'framer-motion'

interface LoadingCardProps {
  className?: string
  lines?: number
  showIcon?: boolean
}

export function LoadingCard({ 
  className, 
  lines = 2, 
  showIcon = true 
}: LoadingCardProps) {
  return (
    <GlassCard className={className}>
      <div className="flex items-center space-x-3">
        {showIcon && (
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <motion.div
              className="w-4 h-4 bg-primary rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <motion.div
              key={index}
              className={`h-4 bg-white/10 rounded ${
                index === lines - 1 ? 'w-2/3' : 'w-full'
              }`}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

export function LoadingSkeleton({ 
  className, 
  count = 3 
}: { 
  className?: string
  count?: number 
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingCard key={index} lines={2} />
      ))}
    </div>
  )
}
