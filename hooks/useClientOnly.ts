import { useEffect, useState } from 'react'

/**
 * Hook que retorna true solo cuando estamos en el cliente
 * Útil para evitar problemas de hidratación en SSR
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
