// Configuración personalizada para Solana Wallet Adapter
// que evita el problema con @solana-mobile/wallet-adapter-mobile

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

// Solo incluir wallets que no requieran el adaptador móvil
export const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
]

export const network = WalletAdapterNetwork.Mainnet
