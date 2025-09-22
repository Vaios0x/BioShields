'use client'

import Link from 'next/link'
import { Shield, Twitter, Github, MessageCircle, Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

const footerLinks = {
  product: [
    { name: 'Seguros Paramétricos', href: '/marketplace' },
    { name: 'Pools de Liquidez', href: '/pools' },
    { name: 'Claims Center', href: '/claims' },
    { name: 'Gobernanza', href: '/governance' },
  ],
  resources: [
    { name: 'Documentación', href: '/docs' },
    { name: 'Whitepaper', href: '/whitepaper' },
    { name: 'API', href: '/api' },
    { name: 'Auditorías', href: '/audits' },
  ],
  community: [
    { name: 'Twitter', href: 'https://twitter.com/bioshield', icon: Twitter },
    { name: 'Discord', href: 'https://discord.gg/bioshield', icon: Users },
    { name: 'Telegram', href: 'https://t.me/bioshield', icon: MessageCircle },
    { name: 'GitHub', href: 'https://github.com/bioshield', icon: Github },
  ],
  legal: [
    { name: 'Términos de Servicio', href: '/terms' },
    { name: 'Política de Privacidad', href: '/privacy' },
    { name: 'Disclaimer', href: '/disclaimer' },
    { name: 'Licencias', href: '/licenses' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-dark-bg/50 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">BioShield</span>
            </Link>
            <p className="text-text-secondary text-sm mb-4">
              Plataforma de seguros paramétricos descentralizados para el ecosistema DeSci y biotech.
            </p>
            <div className="flex space-x-4">
              {footerLinks.community.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary hover:text-primary transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Producto</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Recursos</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Comunidad</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm flex items-center space-x-2"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats */}
        <GlassCard 
          className="mt-8 p-6"
          children={
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">$2.4M</div>
                <div className="text-sm text-text-secondary">TVL Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">156</div>
                <div className="text-sm text-text-secondary">Pólizas Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">23</div>
                <div className="text-sm text-text-secondary">Claims Procesados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">12.5%</div>
                <div className="text-sm text-text-secondary">APY Promedio</div>
              </div>
            </div>
          }
        />

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-secondary text-sm">
            © 2025 BioShield Insurance. Todos los derechos reservados.
          </p>
          <p className="text-text-secondary text-sm mt-2 md:mt-0">
            Construido para DeSci Builders Hackathon 2025 - Próspera/Infinita City
          </p>
        </div>
      </div>
    </footer>
  )
}
