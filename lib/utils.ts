import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function calculateHealthScore(policies: any[]): number {
  if (!policies.length) return 100
  
  const activePolicies = policies.filter(p => p.status === 'active')
  const claimedPolicies = policies.filter(p => p.status === 'claimed')
  
  const claimRate = claimedPolicies.length / policies.length
  const activeRate = activePolicies.length / policies.length
  
  // Health score calculation (0-100)
  const healthScore = Math.max(0, 100 - (claimRate * 50) + (activeRate * 20))
  
  return Math.round(healthScore)
}

export function calculateRiskExposure(policies: any[]): number {
  if (!policies.length) return 0
  
  const totalCoverage = policies.reduce((sum, policy) => sum + policy.coverageAmount, 0)
  const activeCoverage = policies
    .filter(p => p.status === 'active')
    .reduce((sum, policy) => sum + policy.coverageAmount, 0)
  
  return (activeCoverage / totalCoverage) * 100
}

export function generatePolicyId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `BS-${timestamp}-${random}`.toUpperCase()
}

export function validateAddress(address: string, type: 'solana' | 'ethereum'): boolean {
  if (type === 'solana') {
    // Solana address validation (base58, 32-44 characters)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    return base58Regex.test(address)
  } else {
    // Ethereum address validation (0x + 40 hex characters)
    const ethRegex = /^0x[a-fA-F0-9]{40}$/
    return ethRegex.test(address)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
