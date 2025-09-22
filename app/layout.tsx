import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BioShield - Seguros Paramétricos DeSci',
  description: 'Plataforma de seguros paramétricos descentralizados para el sector biotech y DeSci. Protege tu investigación con tecnología blockchain.',
  keywords: 'DeSci, biotech, seguros, blockchain, Solana, Base, $LIVES',
  authors: [{ name: 'BioShield Team' }],
  openGraph: {
    title: 'BioShield - Seguros Paramétricos DeSci',
    description: 'Plataforma de seguros paramétricos descentralizados para el sector biotech y DeSci.',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BioShield - Seguros Paramétricos DeSci',
    description: 'Plataforma de seguros paramétricos descentralizados para el sector biotech y DeSci.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieString = cookieStore.toString()

  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers cookies={cookieString}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 15, 35, 0.9)',
                color: '#f3f4f6',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
