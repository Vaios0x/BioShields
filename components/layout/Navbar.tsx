'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Shield, Wallet, Network } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { WalletConnect } from '@/components/web3/WalletConnect'
import { NetworkSwitcher } from '@/components/web3/NetworkSwitcher'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Marketplace', href: '/marketplace' },
  { name: 'Claims', href: '/claims' },
  { name: 'Pools', href: '/pools' },
  { name: 'Gobernanza', href: '/governance' },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">BioShield</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200 hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-text-secondary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <NetworkSwitcher />
            <WalletConnect />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-secondary hover:text-primary transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md",
                    pathname === item.href
                      ? "text-primary bg-primary/10"
                      : "text-text-secondary hover:text-primary hover:bg-white/5"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 space-y-3">
                <NetworkSwitcher />
                <WalletConnect />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
