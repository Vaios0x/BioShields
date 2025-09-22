'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'
import { Wallet, CheckCircle, AlertTriangle, Network } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'

export function ConnectionStatus() {
  const { open } = useAppKit()
  const { isConnected, chain } = useAccount()

  if (isConnected) {
    return (
      <GlassCard className="border-success/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-success">
              Wallet Conectado
            </div>
            <div className="text-xs text-text-secondary flex items-center space-x-1">
              <Network className="w-3 h-3" />
              <span>{chain?.name || 'Red conectada'}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="border-accent/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-accent">
              Wallet No Conectado
            </div>
            <div className="text-xs text-text-secondary">
              Conecta MetaMask, Phantom o cualquier wallet compatible
            </div>
          </div>
        </div>
        <GradientButton size="sm" onClick={() => open()}>
          <Wallet className="w-4 h-4 mr-2" />
          Conectar
        </GradientButton>
      </div>
    </GlassCard>
  )
}
