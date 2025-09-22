import { useEffect, useLayoutEffect } from 'react'

/**
 * Hook que usa useLayoutEffect en el cliente y useEffect en el servidor
 * para evitar warnings de hidratación en SSR
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
