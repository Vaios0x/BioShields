'use client'

import { ReactNode, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  gradient?: boolean
  onClick?: () => void
  style?: CSSProperties
}

export function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow = false, 
  gradient = false,
  onClick,
  style 
}: GlassCardProps) {
  const baseClasses = "glass-card p-6"
  const hoverClasses = hover ? "hover:scale-105 transition-transform duration-300 cursor-pointer" : ""
  const glowClasses = glow ? "neon-glow" : ""
  const gradientClasses = gradient ? "gradient-border" : ""

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        baseClasses,
        hoverClasses,
        glowClasses,
        gradientClasses,
        className
      )}
      style={style}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
    >
      {gradient ? (
        <div className="glass-card h-full w-full">
          {children}
        </div>
      ) : (
        children
      )}
    </motion.div>
  )
}
