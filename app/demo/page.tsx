'use client'

import { OnChainDemo } from '@/components/demo/OnChainDemo'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-dark-bg pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Demo Interactivo BioShield
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            Experimenta con las funcionalidades principales de BioShield en tiempo real. 
            Conecta tu wallet y sigue los pasos para crear pólizas, aprobar tokens y explorar el ecosistema.
          </p>
        </div>
        
        <OnChainDemo />
      </div>
    </div>
  )
}
