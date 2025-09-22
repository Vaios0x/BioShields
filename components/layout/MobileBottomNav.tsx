'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Shield, FileText, TrendingUp, Users, Activity, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: Shield },
  { name: 'Marketplace', href: '/marketplace', icon: FileText },
  { name: 'Demo', href: '/demo', icon: Zap },
  { name: 'Pools', href: '/pools', icon: TrendingUp },
  { name: 'Predicciones', href: '/prediction', icon: Activity },
  { name: 'NFTs', href: '/nft', icon: Star },
  { name: 'Gobernanza', href: '/governance', icon: Users },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-dark-bg/90 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-primary hover:bg-white/5"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mb-1",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
