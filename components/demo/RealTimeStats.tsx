'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Shield } from 'lucide-react'

interface RealTimeStatsProps {
  isRunning: boolean
  currentStep: number
  showLivesDiscount: boolean
}

export function RealTimeStats({ isRunning, currentStep, showLivesDiscount }: RealTimeStatsProps) {
  const [stats, setStats] = useState({
    tvl: 10500000,
    activePolicies: 47,
    claimsPaid: 23,
    avgProcessTime: "12 seconds",
    livesPrice: 0.85,
    shieldPrice: 0.42,
    networkActivity: 156
  })

  const [priceChanges, setPriceChanges] = useState({
    lives: 0,
    shield: 0,
    tvl: 0
  })

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      // Simulate real-time price changes
      const livesChange = (Math.random() - 0.5) * 0.1
      const shieldChange = (Math.random() - 0.5) * 0.05
      const tvlChange = Math.random() * 10000

      setStats(prev => ({
        ...prev,
        livesPrice: Math.max(0.5, prev.livesPrice + livesChange),
        shieldPrice: Math.max(0.2, prev.shieldPrice + shieldChange),
        tvl: prev.tvl + tvlChange,
        networkActivity: prev.networkActivity + Math.floor(Math.random() * 3)
      }))

      setPriceChanges({
        lives: livesChange,
        shield: shieldChange,
        tvl: tvlChange
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    if (currentStep >= 1) {
      // Update stats based on demo progress
      setStats(prev => ({
        ...prev,
        tvl: prev.tvl + (showLivesDiscount ? 125000 : 250000),
        activePolicies: prev.activePolicies + 1
      }))
    }

    if (currentStep >= 4) {
      // Final payout
      setStats(prev => ({
        ...prev,
        claimsPaid: prev.claimsPaid + 1,
        avgProcessTime: "8 seconds"
      }))
    }
  }, [currentStep, showLivesDiscount])

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    change, 
    format = 'number',
    color = 'text-white'
  }: {
    title: string
    value: number | string
    icon: React.ReactNode
    change?: number
    format?: 'number' | 'currency' | 'percentage'
    color?: string
  }) => {
    const formatValue = () => {
      if (format === 'currency') {
        return `$${typeof value === 'number' ? value.toLocaleString() : value}`
      }
      if (format === 'percentage') {
        return `${value}%`
      }
      return typeof value === 'number' ? value.toLocaleString() : value
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4 text-center"
      >
        <div className="flex items-center justify-center mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        <div className={`text-2xl font-bold ${color} mb-1`}>
          {formatValue()}
        </div>
        <div className="text-sm text-gray-400 mb-2">
          {title}
        </div>
        {change !== undefined && (
          <div className={`text-xs flex items-center justify-center gap-1 ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(2)}%
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Real-Time Network Stats
        </h3>
        <p className="text-gray-400 text-sm">
          Live data from BioShield protocol
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Locked"
          value={stats.tvl}
          icon={<DollarSign className="w-4 h-4" />}
          change={priceChanges.tvl > 0 ? (priceChanges.tvl / stats.tvl) * 100 : 0}
          format="currency"
          color="text-green-400"
        />
        
        <StatCard
          title="Active Policies"
          value={stats.activePolicies}
          icon={<Shield className="w-4 h-4" />}
          format="number"
          color="text-blue-400"
        />
        
        <StatCard
          title="Claims Paid"
          value={stats.claimsPaid}
          icon={<Activity className="w-4 h-4" />}
          format="number"
          color="text-purple-400"
        />
        
        <StatCard
          title="Network Activity"
          value={stats.networkActivity}
          icon={<Users className="w-4 h-4" />}
          format="number"
          color="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="$LIVES Price"
          value={stats.livesPrice}
          icon={<TrendingUp className="w-4 h-4" />}
          change={priceChanges.lives > 0 ? (priceChanges.lives / stats.livesPrice) * 100 : 0}
          format="currency"
          color="text-accent"
        />
        
        <StatCard
          title="$SHIELD Price"
          value={stats.shieldPrice}
          icon={<TrendingUp className="w-4 h-4" />}
          change={priceChanges.shield > 0 ? (priceChanges.shield / stats.shieldPrice) * 100 : 0}
          format="currency"
          color="text-secondary"
        />
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white">
              Average Process Time
            </h4>
            <p className="text-sm text-gray-400">
              From claim submission to payout
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {stats.avgProcessTime}
            </div>
            <div className="text-xs text-gray-500">
              vs 3-6 months traditional
            </div>
          </div>
        </div>
      </div>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <h4 className="text-sm font-semibold text-green-400">
                Demo Running
              </h4>
              <p className="text-xs text-gray-400">
                Live transactions being processed...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
