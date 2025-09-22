/**
 * MetaMask Detection and Error Handling Utilities
 * Provides robust detection and error handling for MetaMask integration
 */

// Type assertion for MetaMask
type MetaMaskProvider = {
  isMetaMask?: boolean
  request?: (args: { method: string; params?: any[] }) => Promise<any>
  on?: (event: string, callback: (...args: any[]) => void) => void
  removeListener?: (event: string, callback: (...args: any[]) => void) => void
}

// Helper function to safely access window.ethereum
function getEthereumProvider(): MetaMaskProvider | undefined {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum as MetaMaskProvider
  }
  return undefined
}

export interface MetaMaskInfo {
  isInstalled: boolean
  isLocked: boolean
  isConnected: boolean
  version?: string
  error?: string
}

/**
 * Detects MetaMask installation and status
 */
export async function detectMetaMask(): Promise<MetaMaskInfo> {
  const info: MetaMaskInfo = {
    isInstalled: false,
    isLocked: false,
    isConnected: false
  }

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      info.error = 'No se puede detectar MetaMask fuera del navegador'
      return info
    }

    // Check if MetaMask is installed
    const ethereum = getEthereumProvider()
    if (!ethereum) {
      info.error = 'MetaMask no está instalado'
      return info
    }

    info.isInstalled = true

    // Check if it's actually MetaMask
    if (!ethereum.isMetaMask) {
      info.error = 'No se detectó MetaMask como wallet principal'
      return info
    }

    // Try to get accounts to check if locked
    try {
      if (ethereum.request) {
        const accounts = await ethereum.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          info.isConnected = true
          info.isLocked = false
        } else {
          info.isLocked = true
        }
      }
    } catch (error) {
      info.isLocked = true
      info.error = 'MetaMask está bloqueado o no responde'
    }

    // Try to get version
    try {
      if (ethereum.request) {
        const version = await ethereum.request({ method: 'web3_clientVersion' })
        if (version) {
          info.version = version
        }
      }
    } catch (error) {
      // Version detection is optional, don't fail if it doesn't work
    }

  } catch (error) {
    info.error = error instanceof Error ? error.message : 'Error desconocido al detectar MetaMask'
  }

  return info
}

/**
 * Gets user-friendly error messages for MetaMask errors
 */
export function getMetaMaskErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Error desconocido al conectar con MetaMask'
  }

  const message = error.message.toLowerCase()

  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Conexión cancelada por el usuario'
  }
  
  if (message.includes('already processing') || message.includes('already pending')) {
    return 'Ya hay una solicitud de conexión en proceso. Por favor espera un momento.'
  }
  
  if (message.includes('locked') || message.includes('bloqueado')) {
    return 'MetaMask está bloqueado. Por favor desbloquea tu wallet.'
  }
  
  if (message.includes('not installed') || message.includes('no está instalado')) {
    return 'MetaMask no está instalado. Por favor instala MetaMask para continuar.'
  }
  
  if (message.includes('network') || message.includes('red')) {
    return 'Error de red. Por favor verifica tu conexión a internet.'
  }
  
  if (message.includes('unauthorized') || message.includes('no autorizado')) {
    return 'No tienes permisos para acceder a MetaMask. Por favor verifica la configuración.'
  }
  
  if (message.includes('timeout') || message.includes('tiempo de espera')) {
    return 'La conexión con MetaMask tardó demasiado. Por favor intenta de nuevo.'
  }

  // Return the original error message if we can't categorize it
  return error.message
}

/**
 * Waits for MetaMask to be available
 */
export function waitForMetaMask(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    if (getEthereumProvider()) {
      resolve(true)
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (getEthereumProvider()) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
  })
}

/**
 * Validates if the current network is supported
 */
export function isSupportedNetwork(chainId: number): boolean {
  const supportedChains = [
    84532, // Base Sepolia
    11155420, // Optimism Sepolia
    1, // Ethereum Mainnet (for production)
    8453, // Base Mainnet (for production)
    10, // Optimism Mainnet (for production)
  ]
  
  return supportedChains.includes(chainId)
}

/**
 * Gets network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    8453: 'Base Mainnet',
    10: 'Optimism Mainnet',
    84532: 'Base Sepolia',
    11155420: 'Optimism Sepolia',
  }
  
  return networks[chainId] || `Red desconocida (${chainId})`
}
