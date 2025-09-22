'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { GradientButton } from '@/components/ui/GradientButton'
import { useState, useEffect } from 'react'
import { truncateAddress } from '@/lib/utils'
import toast from 'react-hot-toast'

export function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null)
  const [isSolanaConnected, setIsSolanaConnected] = useState(false)

  // Simple Solana detection
  useEffect(() => {
    const checkSolanaConnection = () => {
      // Check localStorage for Solana connection
      const appKitData = localStorage.getItem('@reown/appkit')
      if (appKitData) {
        try {
          const parsed = JSON.parse(appKitData)
          console.log('🔍 AppKit data:', parsed)
          
          // Look for Solana address in the data
          if (parsed?.solana?.address) {
            setSolanaAddress(parsed.solana.address)
            setIsSolanaConnected(true)
            console.log('✅ Solana connected:', parsed.solana.address)
            return
          }
        } catch (e) {
          console.error('Error parsing AppKit data:', e)
        }
      }
      
      // Reset if no Solana connection found
      setSolanaAddress(null)
      setIsSolanaConnected(false)
    }

    checkSolanaConnection()
    
    // Check every second
    const interval = setInterval(checkSolanaConnection, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleCopyAddress = async () => {
    const addressToCopy = isSolanaConnected ? solanaAddress : address
    if (!addressToCopy) return

    try {
      // Check if clipboard API is available and we have permission
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(addressToCopy)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = addressToCopy
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      setCopied(true)
      toast.success('Dirección copiada al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying address:', error)
      toast.error('Error al copiar dirección')
    }
  }

  const handleDisconnect = async () => {
    try {
      if (isSolanaConnected) {
        // For Solana, we need to clear the AppKit storage
        localStorage.removeItem('@reown/appkit')
        setSolanaAddress(null)
        setIsSolanaConnected(false)
        toast.success('Wallet Solana desconectada')
      } else {
        await disconnect()
        toast.success('Wallet Ethereum desconectada')
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      toast.error('Error al desconectar wallet')
    }
  }

  // Check if we have any connection
  const hasConnection = isSolanaConnected || (isConnected && address)

  if (hasConnection) {
    const displayAddress = isSolanaConnected ? solanaAddress : address
    const displayNetwork = isSolanaConnected ? 'Solana Testnet' : chain?.name || 'Ethereum'
    
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-text-secondary">
            {displayNetwork}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyAddress}
            className="flex items-center space-x-2 text-sm text-text-primary hover:text-primary transition-colors duration-200"
            title="Copiar dirección"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:block">
              {displayAddress ? truncateAddress(displayAddress) : 'Conectando...'}
            </span>
          </button>
          
          <button
            onClick={handleDisconnect}
            className="text-text-secondary hover:text-danger transition-colors duration-200"
            title="Desconectar wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Debug: Log current state
  console.log('🎯 WalletConnect render:', {
    isSolanaConnected,
    solanaAddress,
    isConnected,
    address,
    hasConnection
  })

  return (
    <div className="flex items-center space-x-2">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mr-2 bg-black/50 px-2 py-1 rounded">
          {isSolanaConnected ? '✅ Solana' : isConnected ? '✅ Ethereum' : '❌ Disconnected'}
          <br />
          {isSolanaConnected ? (solanaAddress ? truncateAddress(solanaAddress) : 'No Solana address') : 
           isConnected ? (address ? truncateAddress(address) : 'No Ethereum address') : 'No connection'}
        </div>
      )}
      
      {/* Custom button for desktop */}
      <GradientButton
        onClick={() => open()}
        size="sm"
        className="hidden sm:flex"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Conectar Wallet
      </GradientButton>

      {/* Custom button for mobile */}
      <div className="sm:hidden">
        <GradientButton
          onClick={() => open()}
          size="sm"
        >
          <Wallet className="w-4 h-4" />
        </GradientButton>
      </div>

      {/* Native Reown AppKit button (alternative) */}
      <div className="hidden">
        <appkit-button />
      </div>
    </div>
  )
}