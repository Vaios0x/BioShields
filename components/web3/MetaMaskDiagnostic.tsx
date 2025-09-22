'use client'

import { useState, useEffect } from 'react'
import { detectMetaMask, MetaMaskInfo } from '@/lib/utils/metamask-detector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'

interface MetaMaskDiagnosticProps {
  onClose?: () => void
}

export function MetaMaskDiagnostic({ onClose }: MetaMaskDiagnosticProps) {
  const [metaMaskInfo, setMetaMaskInfo] = useState<MetaMaskInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const checkMetaMask = async () => {
    setRefreshing(true)
    try {
      const info = await detectMetaMask()
      setMetaMaskInfo(info)
    } catch (error) {
      console.error('Error checking MetaMask:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    checkMetaMask()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean, text: string) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {text}
      </Badge>
    )
  }

  const openMetaMaskInstall = () => {
    window.open('https://metamask.io/download/', '_blank')
  }

  const openMetaMaskUnlock = () => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Diagnóstico de MetaMask
          </CardTitle>
          <CardDescription>
            Verificando el estado de MetaMask...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Diagnóstico de MetaMask
            </CardTitle>
            <CardDescription>
              Verificación del estado de tu wallet MetaMask
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkMetaMask}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {metaMaskInfo && (
          <>
            {/* Installation Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(metaMaskInfo.isInstalled)}
                <div>
                  <p className="font-medium">MetaMask Instalado</p>
                  <p className="text-sm text-muted-foreground">
                    {metaMaskInfo.isInstalled 
                      ? 'MetaMask está instalado en tu navegador'
                      : 'MetaMask no está instalado'
                    }
                  </p>
                </div>
              </div>
              {getStatusBadge(metaMaskInfo.isInstalled, 
                metaMaskInfo.isInstalled ? 'Instalado' : 'No instalado'
              )}
            </div>

            {/* Connection Status */}
            {metaMaskInfo.isInstalled && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(!metaMaskInfo.isLocked)}
                  <div>
                    <p className="font-medium">Estado de la Wallet</p>
                    <p className="text-sm text-muted-foreground">
                      {metaMaskInfo.isLocked 
                        ? 'MetaMask está bloqueado'
                        : 'MetaMask está desbloqueado'
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(!metaMaskInfo.isLocked, 
                  metaMaskInfo.isLocked ? 'Bloqueado' : 'Desbloqueado'
                )}
              </div>
            )}

            {/* Connection Status */}
            {metaMaskInfo.isInstalled && !metaMaskInfo.isLocked && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(metaMaskInfo.isConnected)}
                  <div>
                    <p className="font-medium">Conexión Activa</p>
                    <p className="text-sm text-muted-foreground">
                      {metaMaskInfo.isConnected 
                        ? 'Conectado a la aplicación'
                        : 'No conectado a la aplicación'
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(metaMaskInfo.isConnected, 
                  metaMaskInfo.isConnected ? 'Conectado' : 'No conectado'
                )}
              </div>
            )}

            {/* Version Info */}
            {metaMaskInfo.version && (
              <div className="p-3 border rounded-lg">
                <p className="font-medium mb-1">Versión de MetaMask</p>
                <p className="text-sm text-muted-foreground">{metaMaskInfo.version}</p>
              </div>
            )}

            {/* Error Message */}
            {metaMaskInfo.error && (
              <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-medium">Error detectado</p>
                </div>
                <p className="text-sm text-red-600 mt-1">{metaMaskInfo.error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4">
              {!metaMaskInfo.isInstalled && (
                <Button onClick={openMetaMaskInstall} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Instalar MetaMask
                </Button>
              )}
              
              {metaMaskInfo.isInstalled && metaMaskInfo.isLocked && (
                <Button onClick={openMetaMaskUnlock} className="w-full">
                  Desbloquear MetaMask
                </Button>
              )}
              
              {metaMaskInfo.isInstalled && !metaMaskInfo.isLocked && !metaMaskInfo.isConnected && (
                <Button onClick={onClose} className="w-full">
                  Intentar Conectar
                </Button>
              )}
            </div>

            {/* Help Links */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">¿Necesitas ayuda?</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://metamask.io/faqs/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    FAQ MetaMask
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://support.metamask.io/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Soporte
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
