'use client'

import React, { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  glow?: boolean
  fullWidth?: boolean
}

export function GradientButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  const baseClasses = "relative overflow-hidden rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg"
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 focus:ring-primary",
    secondary: "bg-gradient-to-r from-secondary to-accent text-white hover:from-secondary/90 hover:to-accent/90 focus:ring-secondary",
    accent: "bg-gradient-to-r from-accent to-primary text-white hover:from-accent/90 hover:to-primary/90 focus:ring-accent",
    danger: "bg-gradient-to-r from-danger to-red-600 text-white hover:from-danger/90 hover:to-red-600/90 focus:ring-danger",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }

  const glowClasses = glow ? "neon-glow" : ""
  const widthClasses = fullWidth ? "w-full" : ""

  return (
    <motion.button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        glowClasses,
        widthClasses,
        "btn-hover",
        className
      )}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      {...props}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
      
      <span className={cn("transition-opacity duration-300", loading && "opacity-0")}>
        {children}
      </span>
    </motion.button>
  )
}
