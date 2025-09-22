'use client'

import { useBalance } from 'wagmi'
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { Coins } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { formatNumber } from '@/lib/utils'

interface TokenBalanceProps {
  tokenAddress?: string
  tokenSymbol?: string
  decimals?: number
  className?: string
}

export function TokenBalance({ 
  tokenAddress, 
  tokenSymbol = 'ETH', 
  decimals = 18,
  className 
}: TokenBalanceProps) {
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ethereum/Base token balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: address,
    token: tokenAddress as `0x${string}`,
  })

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setError('Connection timeout')
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [loading])

  // Mock balance when no wallet is connected
  const mockBalance = tokenSymbol === '$LIVES' ? 1250 : 850
  const balance = ethBalance ? parseFloat(ethBalance.formatted) : mockBalance
  const isLoading = ethLoading && isConnected

  if (isLoading) {
    return (
      <GlassCard className={className}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <Coins className="w-4 h-4 text-text-secondary animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-3 bg-white/5 rounded animate-pulse mt-1 w-2/3" />
          </div>
        </div>
      </GlassCard>
    )
  }

  if (error && isConnected) {
    return (
      <GlassCard className={className}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <Coins className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-red-400">
              Error
            </div>
            <div className="text-sm text-text-secondary">
              No se pudo cargar el balance
            </div>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className={className}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
          <Coins className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-text-primary">
            {formatNumber(balance)} {tokenSymbol}
          </div>
          <div className="text-sm text-text-secondary">
            {isConnected ? 'Balance disponible' : 'Balance demo'}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function LivesTokenBalance({ className }: { className?: string }) {
  return (
    <TokenBalance
      tokenAddress={process.env.NEXT_PUBLIC_LIVES_TOKEN}
      tokenSymbol="$LIVES"
      decimals={9}
      className={className}
    />
  )
}

export function ShieldTokenBalance({ className }: { className?: string }) {
  return (
    <TokenBalance
      tokenAddress={process.env.NEXT_PUBLIC_SHIELD_TOKEN}
      tokenSymbol="$SHIELD"
      decimals={18}
      className={className}
    />
  )
}
