'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Award, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Copy,
  Star,
  Shield,
  Crown,
  Gift
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { formatCurrency, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

interface RegulatoryNFTProps {
  onMint?: (tokenId: string) => void
}

interface NFTMetadata {
  tokenId: string
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string | number
  }[]
  benefits: string[]
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  mintDate: Date
  owner: string
  price?: number
}

export function RegulatoryNFT({ onMint }: RegulatoryNFTProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFTMetadata | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [mintedNFTs, setMintedNFTs] = useState<NFTMetadata[]>([])
  const [showMarketplace, setShowMarketplace] = useState(false)

  // Mock NFT templates
  const nftTemplates: NFTMetadata[] = [
    {
      tokenId: 'PROSPERA-001',
      name: 'Próspera Fast-Track Approval',
      description: 'NFT que otorga acceso prioritario a procesos regulatorios en Próspera. Reduce tiempo de aprobación en 70% y elimina requisitos burocráticos tradicionales.',
      image: '/api/placeholder/400/400',
      attributes: [
        { trait_type: 'Regulatory Speed', value: '70% Faster' },
        { trait_type: 'Jurisdiction', value: 'Próspera' },
        { trait_type: 'Validity', value: '2 Years' },
        { trait_type: 'Transferable', value: 'Yes' },
        { trait_type: 'Rarity', value: 'Epic' }
      ],
      benefits: [
        'Aprobación regulatoria 70% más rápida',
        'Acceso prioritario a comités de revisión',
        'Eliminación de requisitos burocráticos',
        'Descuento 25% en fees regulatorios',
        'Transferible y vendible en marketplace'
      ],
      rarity: 'epic',
      mintDate: new Date(),
      owner: '0x...',
      price: 50000
    },
    {
      tokenId: 'PROSPERA-002',
      name: 'Clinical Trial Accelerator',
      description: 'NFT especializado para acelerar ensayos clínicos en Próspera. Incluye acceso a redes de pacientes y centros de investigación prioritarios.',
      image: '/api/placeholder/400/400',
      attributes: [
        { trait_type: 'Trial Speed', value: '50% Faster' },
        { trait_type: 'Patient Access', value: 'Priority' },
        { trait_type: 'Validity', value: '3 Years' },
        { trait_type: 'Transferable', value: 'Yes' },
        { trait_type: 'Rarity', value: 'Rare' }
      ],
      benefits: [
        'Reclutamiento de pacientes 50% más rápido',
        'Acceso a red de centros de investigación',
        'Prioridad en comités de ética',
        'Descuento 30% en costos de ensayo',
        'Soporte técnico especializado'
      ],
      rarity: 'rare',
      mintDate: new Date(),
      owner: '0x...',
      price: 35000
    },
    {
      tokenId: 'PROSPERA-003',
      name: 'Regulatory Compliance Master',
      description: 'NFT de máxima rareza que otorga acceso completo al ecosistema regulatorio de Próspera. Incluye todas las ventajas y beneficios premium.',
      image: '/api/placeholder/400/400',
      attributes: [
        { trait_type: 'Regulatory Speed', value: '90% Faster' },
        { trait_type: 'Compliance', value: 'Full Access' },
        { trait_type: 'Validity', value: '5 Years' },
        { trait_type: 'Transferable', value: 'Yes' },
        { trait_type: 'Rarity', value: 'Legendary' }
      ],
      benefits: [
        'Aprobación regulatoria 90% más rápida',
        'Acceso completo a todos los beneficios',
        'Consultoría regulatoria gratuita',
        'Descuento 50% en todos los fees',
        'Acceso VIP a eventos regulatorios',
        'Transferible y vendible'
      ],
      rarity: 'legendary',
      mintDate: new Date(),
      owner: '0x...',
      price: 100000
    }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-text-secondary'
    }
  }

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-400/20'
      case 'rare': return 'bg-blue-400/20'
      case 'epic': return 'bg-purple-400/20'
      case 'legendary': return 'bg-yellow-400/20'
      default: return 'bg-white/10'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return Shield
      case 'rare': return Star
      case 'epic': return Crown
      case 'legendary': return Gift
      default: return Shield
    }
  }

  const mintNFT = async (template: NFTMetadata) => {
    setIsMinting(true)
    
    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newNFT: NFTMetadata = {
        ...template,
        tokenId: `PROSPERA-${Date.now()}`,
        mintDate: new Date(),
        owner: '0x...' // Current user address
      }
      
      setMintedNFTs(prev => [...prev, newNFT])
      setSelectedNFT(newNFT)
      
      if (onMint) {
        onMint(newNFT.tokenId)
      }
      
      toast.success('NFT mintado exitosamente!')
    } catch (error) {
      toast.error('Error al mintear NFT')
    } finally {
      setIsMinting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              Próspera Regulatory Fast-Track NFTs
            </h3>
            <p className="text-text-secondary text-sm">
              NFTs que aceleran procesos regulatorios en Próspera y son transferibles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-primary mb-1">70%</div>
            <div className="text-sm text-text-secondary">Más rápido</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-secondary mb-1">25%</div>
            <div className="text-sm text-text-secondary">Descuento fees</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-accent mb-1">100%</div>
            <div className="text-sm text-text-secondary">Transferible</div>
          </div>
        </div>

        <div className="flex space-x-4">
          <GradientButton onClick={() => setShowMarketplace(false)}>
            <Award className="w-4 h-4 mr-2" />
            Mintear NFT
          </GradientButton>
          <GradientButton 
            variant="secondary" 
            onClick={() => setShowMarketplace(true)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Marketplace
          </GradientButton>
        </div>
      </GlassCard>

      {/* NFT Templates */}
      {!showMarketplace && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {nftTemplates.map((template, index) => {
            const RarityIcon = getRarityIcon(template.rarity)
            return (
              <motion.div
                key={template.tokenId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GlassCard hover glow className="h-full">
                  <div className="space-y-4">
                    {/* NFT Image */}
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                        <RarityIcon className="w-16 h-16 text-primary" />
                      </div>
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getRarityBg(template.rarity)} ${getRarityColor(template.rarity)}`}>
                        {template.rarity.toUpperCase()}
                      </div>
                    </div>

                    {/* NFT Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary mb-2">
                        {template.name}
                      </h4>
                      <p className="text-text-secondary text-sm mb-4">
                        {template.description}
                      </p>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-text-primary">
                        Atributos:
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {template.attributes.slice(0, 4).map((attr, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="text-text-secondary">{attr.trait_type}:</div>
                            <div className="text-text-primary font-semibold">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h5 className="text-sm font-semibold text-text-primary mb-2">
                        Beneficios:
                      </h5>
                      <ul className="space-y-1">
                        {template.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-text-secondary">
                            <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price and Actions */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <div className="text-sm text-text-secondary">Precio:</div>
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(template.price || 0)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-text-secondary">ID:</div>
                          <div className="text-xs text-text-primary font-mono">
                            {template.tokenId}
                          </div>
                        </div>
                      </div>

                      <GradientButton
                        fullWidth
                        onClick={() => mintNFT(template)}
                        loading={isMinting}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Mintear NFT
                      </GradientButton>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Marketplace */}
      {showMarketplace && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Marketplace de NFTs
            </h3>
            <p className="text-text-secondary">
              Compra y vende NFTs de Próspera Regulatory Fast-Track
            </p>
          </div>

          {mintedNFTs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mintedNFTs.map((nft, index) => {
                const RarityIcon = getRarityIcon(nft.rarity)
                return (
                  <motion.div
                    key={nft.tokenId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <GlassCard hover glow>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                              <RarityIcon className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-text-primary">
                                {nft.name}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityBg(nft.rarity)} ${getRarityColor(nft.rarity)}`}>
                                  {nft.rarity.toUpperCase()}
                                </span>
                                <span className="text-xs text-text-secondary">
                                  {nft.mintDate.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(nft.tokenId)}
                            className="text-text-secondary hover:text-primary transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-text-secondary">Token ID:</span>
                            <div className="text-text-primary font-mono text-xs">
                              {nft.tokenId}
                            </div>
                          </div>
                          <div>
                            <span className="text-text-secondary">Propietario:</span>
                            <div className="text-text-primary font-mono text-xs">
                              {nft.owner}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <GradientButton size="sm" fullWidth>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver en Explorer
                          </GradientButton>
                          <GradientButton size="sm" variant="secondary" fullWidth>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Vender
                          </GradientButton>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No tienes NFTs mintados
              </h3>
              <p className="text-text-secondary mb-6">
                Mintea tu primer NFT de Próspera Regulatory Fast-Track
              </p>
              <GradientButton onClick={() => setShowMarketplace(false)}>
                <Award className="w-4 h-4 mr-2" />
                Mintear NFT
              </GradientButton>
            </div>
          )}
        </div>
      )}

      {/* Selected NFT Details */}
      {selectedNFT && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">
                NFT Minteado Exitosamente
              </h3>
              <button
                onClick={() => setSelectedNFT(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">
                  {selectedNFT.name}
                </h4>
                <p className="text-text-secondary text-sm mb-4">
                  {selectedNFT.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Token ID:</span>
                    <span className="text-text-primary font-mono">{selectedNFT.tokenId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Rareza:</span>
                    <span className={`font-semibold ${getRarityColor(selectedNFT.rarity)}`}>
                      {selectedNFT.rarity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Minteado:</span>
                    <span className="text-text-primary">
                      {selectedNFT.mintDate.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-text-primary mb-2">
                  Beneficios Activos:
                </h5>
                <ul className="space-y-2">
                  {selectedNFT.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <GradientButton fullWidth>
                <Shield className="w-4 h-4 mr-2" />
                Aplicar a Seguro
              </GradientButton>
              <GradientButton variant="secondary" fullWidth>
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver en Blockchain
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
