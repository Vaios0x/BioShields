'use client'

import { useEffect, useRef, RefObject } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  connections: Particle[]
  opacity: number
  size: number
  color: string
}

interface NeuralAnimationOptions {
  particleCount?: number
  connectionDistance?: number
  particleSpeed?: number
  colors?: string[]
  opacity?: number
  size?: number
  mouseInteraction?: boolean
}

export function useNeuralAnimation(
  canvasRef: RefObject<HTMLCanvasElement>,
  options: NeuralAnimationOptions = {}
) {
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })

  const {
    particleCount = 100,
    connectionDistance = 150,
    particleSpeed = 0.5,
    colors = ['#7c3aed', '#06b6d4', '#f59e0b'],
    opacity = 0.1,
    size = 2,
    mouseInteraction = true
  } = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof window === 'undefined') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      if (typeof window !== 'undefined') {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles
    particlesRef.current = []
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * particleSpeed,
        vy: (Math.random() - 0.5) * particleSpeed,
        connections: [],
        opacity: Math.random() * opacity + opacity * 0.5,
        size: size + Math.random() * size,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    if (mouseInteraction && typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Mouse interaction
        if (mouseInteraction) {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100) {
            const force = (100 - distance) / 100
            particle.vx += (dx / distance) * force * 0.01
            particle.vy += (dy / distance) * force * 0.01
          }
        }

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // Limit velocity
        const maxVelocity = particleSpeed * 2
        const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
        if (velocity > maxVelocity) {
          particle.vx = (particle.vx / velocity) * maxVelocity
          particle.vy = (particle.vy / velocity) * maxVelocity
        }

        // Find connections
        particle.connections = []
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const distance = Math.hypot(
              particle.x - otherParticle.x,
              particle.y - otherParticle.y
            )
            if (distance < connectionDistance) {
              particle.connections.push(otherParticle)
            }
          }
        })

        // Draw connections
        particle.connections.forEach(connectedParticle => {
          const distance = Math.hypot(
            particle.x - connectedParticle.x,
            particle.y - connectedParticle.y
          )
          const connectionOpacity = (1 - distance / connectionDistance) * particle.opacity * 0.3

          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(connectedParticle.x, connectedParticle.y)
          ctx.strokeStyle = `rgba(124, 58, 237, ${connectionOpacity})`
          ctx.lineWidth = 1
          ctx.stroke()
        })

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeCanvas)
        if (mouseInteraction) {
          window.removeEventListener('mousemove', handleMouseMove)
        }
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef, particleCount, connectionDistance, particleSpeed, colors, opacity, size, mouseInteraction])

  return {
    particles: particlesRef.current,
    pause: () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    },
    resume: () => {
      // Resume animation by re-running the effect
      // This is handled by the useEffect dependency array
    }
  }
}

export function useParticleSystem(canvasRef: RefObject<HTMLCanvasElement>) {
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof window === 'undefined') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      if (typeof window !== 'undefined') {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles with different behaviors
    particlesRef.current = []
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
        opacity: Math.random() * 0.3 + 0.1,
        size: 1 + Math.random() * 2,
        color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)` // Blue to purple range
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        // Update position with some randomness
        particle.x += particle.vx + (Math.random() - 0.5) * 0.1
        particle.y += particle.vy + (Math.random() - 0.5) * 0.1

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // Draw particle with glow effect
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        
        // Create glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        )
        gradient.addColorStop(0, particle.color)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.globalAlpha = particle.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeCanvas)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasRef])

  return particlesRef.current
}
