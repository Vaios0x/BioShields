'use client'

import React, { useState, useEffect } from 'react'
import { useChainId, useSwitchChain, useAccount } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { ChevronDown, Network, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const networks = [
  { 
    id: 'solana-testnet', 
    name: 'Solana Testnet', 
    chainId: 'testnet', 
    icon: '🟣',
    type: 'solana' as const
  },
  { 
    id: 'base-sepolia', 
    name: 'Base Sepolia', 
    chainId: 84532, 
    icon: '🔵',
    type: 'ethereum' as const
  },
  { 
    id: 'optimism-sepolia', 
    name: 'Optimism Sepolia', 
    chainId: 11155420, 
    icon: '🟠',
    type: 'ethereum' as const
  },
]

export function NetworkSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentNetworkType, setCurrentNetworkType] = useState<'ethereum' | 'solana'>('ethereum')
  
  // Ethereum/Base hooks
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isConnected: ethConnected } = useAccount()
  
  // AppKit hook
  const { open } = useAppKit()

  // Detect current network type based on connection state
  useEffect(() => {
    // Check if we're connected to Solana by looking at the AppKit state
    const checkSolanaConnection = () => {
      // Check if we have a Solana connection in AppKit's storage
      const appKitData = localStorage.getItem('@reown/appkit')
      if (appKitData) {
        try {
          const parsed = JSON.parse(appKitData)
          // Check if we have a Solana address in the AppKit data
          if (parsed?.solana?.address) {
            setCurrentNetworkType('solana')
            return
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      // If we have an Ethereum connection, set to ethereum
      if (ethConnected) {
        setCurrentNetworkType('ethereum')
      }
    }

    checkSolanaConnection()
    
    // Listen for storage changes (when connections change)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '@reown/appkit') {
        checkSolanaConnection()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically in case the storage event doesn't fire
    const interval = setInterval(checkSolanaConnection, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [ethConnected])

  const getCurrentNetwork = () => {
    if (currentNetworkType === 'solana') {
      return networks.find(n => n.id === 'solana-testnet') || networks[0]
    } else {
      return networks.find(n => n.chainId === chainId) || networks[1] // Default to Base Sepolia
    }
  }

  const currentNetwork = getCurrentNetwork()

  const handleNetworkSwitch = async (network: typeof networks[0]) => {
    try {
      if (network.type === 'solana') {
        // Open AppKit modal to connect to Solana
        open()
        toast.success('Abriendo conexión a Solana...')
      } else {
        // Switch Ethereum/Base network
        if (switchChain) {
          await switchChain({ chainId: network.chainId })
          toast.success(`Cambiado a ${network.name}`)
        }
      }
    } catch (error) {
      console.error('Error switching network:', error)
      toast.error('Error al cambiar de red')
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors duration-200"
        aria-label="Cambiar red"
      >
        <Network className="w-4 h-4 text-text-secondary" />
        <span className="text-sm text-text-primary hidden sm:block">
          {currentNetwork.name}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-text-secondary transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 z-50"
          >
            <GlassCard 
              className="p-2 min-w-[200px]"
              children={
                <div className="space-y-1">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => handleNetworkSwitch(network)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200",
                        currentNetwork.id === network.id
                          ? "bg-primary/20 text-primary"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{network.icon}</span>
                        <span>{network.name}</span>
                      </div>
                      {currentNetwork.id === network.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}