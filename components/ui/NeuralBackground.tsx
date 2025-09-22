'use client'

import { useEffect, useRef, useState } from 'react'
import { useClientOnly } from '@/hooks/useClientOnly'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  connections: Particle[]
  opacity: number
  size: number
  color: string
  pulsePhase: number
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(true)
  const isClient = useClientOnly()

  useEffect(() => {
    if (!isClient) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Initialize particles with optimized count for performance
    const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 15000))
    particlesRef.current = []

    const colors = [
      'rgba(124, 58, 237, ', // Primary purple
      'rgba(6, 182, 212, ',  // Secondary cyan
      'rgba(245, 158, 11, ', // Accent orange
    ]

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        connections: [],
        opacity: Math.random() * 0.4 + 0.2,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Simplified background - no gradient for better performance
      ctx.fillStyle = 'rgba(15, 15, 35, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles with optimized performance
      particlesRef.current.forEach((particle, index) => {
        // Simplified mouse interaction
        const mouseDistance = Math.hypot(
          particle.x - mouseRef.current.x,
          particle.y - mouseRef.current.y
        )
        
        if (mouseDistance < 150) {
          const force = (150 - mouseDistance) / 150 * 0.01
          const angle = Math.atan2(particle.y - mouseRef.current.y, particle.x - mouseRef.current.x)
          particle.vx += Math.cos(angle) * force
          particle.vy += Math.sin(angle) * force
        }

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Bounce off edges with damping
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -0.8
          particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy *= -0.8
          particle.y = Math.max(0, Math.min(canvas.height, particle.y))
        }

        // Update pulse phase
        particle.pulsePhase += 0.01

        // Simplified connections - only check nearby particles
        particle.connections = []
        for (let i = index + 1; i < particlesRef.current.length; i++) {
          const otherParticle = particlesRef.current[i]
          const distance = Math.hypot(
            particle.x - otherParticle.x,
            particle.y - otherParticle.y
          )
          if (distance < 120) {
            particle.connections.push(otherParticle)
            
            // Draw connection immediately to avoid double processing
            const opacity = (1 - distance / 120) * particle.opacity * 0.3
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle = particle.color + opacity + ')'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }

        // Simplified particle drawing
        const pulseSize = particle.size * (1 + 0.2 * Math.sin(particle.pulsePhase))
        const pulseOpacity = particle.opacity * (0.8 + 0.2 * Math.sin(particle.pulsePhase))

        // Main particle only
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + pulseOpacity + ')'
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isClient])

  if (!isVisible) return null

  return (
    <canvas
      ref={canvasRef}
      className="neural-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.15,
      }}
    />
  )
}
