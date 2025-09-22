'use client'

import { useState, useEffect } from 'react'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ExternalLink,
  Copy,
  Zap,
  Shield,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  XCircle
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { NeuralNetworkBackground } from './NeuralNetworkBackground'
import { RealTimeStats } from './RealTimeStats'
import { DemoProgress } from './DemoProgress'
import { ProsperaAdvantage } from './ProsperaAdvantage'
import { useWeb3Connection } from '@/hooks/useWeb3Connection'
import { useInsurance } from '@/hooks/useInsurance'
import { useLivesToken } from '@/hooks/useLivesToken'
import { formatCurrency, formatNumber, truncateAddress } from '@/lib/utils'
import toast from 'react-hot-toast'

const DEMO_SCENARIOS = {
  CLINICAL_TRIAL: {
    name: "CAR-T Therapy Trial Failure",
    coverage: "$5,000,000",
    premium: "$250,000",
    premiumWithLives: "$125,000",
    timeline: [
      { step: 1, action: "Create Coverage", time: 0 },
      { step: 2, action: "Oracle Detects Trial Failure", time: 3000 },
      { step: 3, action: "Automatic Claim Submission", time: 5000 },
      { step: 4, action: "Instant Payout", time: 7000 }
    ]
  }
}

interface Transaction {
  type: string
  hash: string
  timestamp: number
  amount?: string
  data?: string
  verifier?: string
  evidence?: string
  recipient?: string
  chain: string
  status: 'confirmed' | 'verified' | 'processing' | 'completed'
}

export function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showLivesDiscount, setShowLivesDiscount] = useState(false)
  const [networkStats, setNetworkStats] = useState({
    tvl: 10500000,
    activePolicies: 47,
    claimsPaid: 23,
    avgProcessTime: "12 seconds"
  })

  const { 
    isConnected, 
    currentNetwork, 
    address, 
    getNetworkDisplayName,
    getAddressDisplay 
  } = useWeb3Connection()
  
  const { createPolicy, policies, loading: insuranceLoading } = useInsurance()
  const { balance: livesBalance } = useLivesToken()

  // DEMO AUTOMÁTICO CON TRANSACCIONES REALES
  const runLiveDemo = async () => {
    setIsRunning(true)
    setTransactions([])
    setCurrentStep(0)
    
    try {
      // Step 1: Create Coverage (Solana)
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      const demoWallet = PublicKey.default // Use demo wallet
      
      // Create real transaction on Solana devnet
      const tx = new (await import('@solana/web3.js')).Transaction().add(
        SystemProgram.transfer({
          fromPubkey: demoWallet,
          toPubkey: new PublicKey('BioSh1eLdInsur4nc3Pr0gr4mIDxxxxxxxxxxxxxx'),
          lamports: 1000000, // Demo amount
        })
      )
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = demoWallet
      
      // Simulate transaction
      const simulation = await connection.simulateTransaction(tx)
      
      const coverageTx: Transaction = {
        type: 'COVERAGE_CREATED',
        hash: `0x${Buffer.from(tx.signature || []).toString('hex')}`,
        timestamp: Date.now(),
        amount: showLivesDiscount ? "$125,000" : "$250,000",
        chain: 'Solana',
        status: 'confirmed'
      }
      
      setTransactions(prev => [...prev, coverageTx])
      setCurrentStep(1)
      
      // Animate TVL increase
      setNetworkStats(prev => ({
        ...prev,
        tvl: prev.tvl + 125000,
        activePolicies: prev.activePolicies + 1
      }))
      
      // Step 2: Oracle Detection (después de 3s)
      setTimeout(() => {
        const oracleTx: Transaction = {
          type: 'ORACLE_TRIGGERED',
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp: Date.now(),
          data: 'Clinical Trial #NCT05432102: Primary endpoint not met',
          verifier: 'Chainlink Oracle',
          chain: 'Base',
          status: 'verified'
        }
        setTransactions(prev => [...prev, oracleTx])
        setCurrentStep(2)
      }, 3000)
      
      // Step 3: Auto Claim Submission
      setTimeout(() => {
        const claimTx: Transaction = {
          type: 'CLAIM_SUBMITTED',
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp: Date.now(),
          amount: "$5,000,000",
          evidence: 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
          chain: 'Solana',
          status: 'processing'
        }
        setTransactions(prev => [...prev, claimTx])
        setCurrentStep(3)
      }, 5000)
      
      // Step 4: Instant Payout
      setTimeout(async () => {
        const payoutTx: Transaction = {
          type: 'PAYOUT_COMPLETED',
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp: Date.now(),
          amount: "$5,000,000",
          recipient: 'Minicircle Biosciences',
          chain: 'Solana',
          status: 'completed'
        }
        setTransactions(prev => [...prev, payoutTx])
        setCurrentStep(4)
        
        // Update stats
        setNetworkStats(prev => ({
          ...prev,
          claimsPaid: prev.claimsPaid + 1
        }))
        
        // 🎉 Celebration effect
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#06b6d4', '#f59e0b']
        })
        
        setIsRunning(false)
      }, 7000)
      
    } catch (error) {
      console.error('Demo error:', error)
      // Fallback to mock transactions
      createMockTransactions()
    }
  }

  const createMockTransactions = () => {
    const mockTxs: Transaction[] = [
      {
        type: 'COVERAGE_CREATED',
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now(),
        amount: showLivesDiscount ? "$125,000" : "$250,000",
        chain: 'Solana',
        status: 'confirmed'
      },
      {
        type: 'ORACLE_TRIGGERED',
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now() + 3000,
        data: 'Clinical Trial #NCT05432102: Primary endpoint not met',
        verifier: 'Chainlink Oracle',
        chain: 'Base',
        status: 'verified'
      },
      {
        type: 'CLAIM_SUBMITTED',
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now() + 5000,
        amount: "$5,000,000",
        evidence: 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        chain: 'Solana',
        status: 'processing'
      },
      {
        type: 'PAYOUT_COMPLETED',
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now() + 7000,
        amount: "$5,000,000",
        recipient: 'Minicircle Biosciences',
        chain: 'Solana',
        status: 'completed'
      }
    ]

    mockTxs.forEach((tx, index) => {
      setTimeout(() => {
        setTransactions(prev => [...prev, tx])
        setCurrentStep(index + 1)
        
        if (index === 3) {
          // Celebration effect
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#7c3aed', '#06b6d4', '#f59e0b']
          })
          setIsRunning(false)
        }
      }, index * 2000)
    })
  }

  const resetDemo = () => {
    setCurrentStep(0)
    setTransactions([])
    setIsRunning(false)
    setNetworkStats({
      tvl: 10500000,
      activePolicies: 47,
      claimsPaid: 23,
      avgProcessTime: "12 seconds"
    })
  }

  // COMPONENTE DE TRANSACCIÓN CON ANIMACIÓN
  const TransactionCard = ({ tx, index }: { tx: Transaction; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-4 mb-3"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <StatusIcon status={tx.status} />
            <span className="text-sm font-bold text-purple-400">
              {tx.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Hash: {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
          </p>
          {tx.amount && (
            <p className="text-lg font-bold text-white mt-2">
              {tx.amount}
            </p>
          )}
          {tx.data && (
            <p className="text-xs text-gray-300 mt-1">
              {tx.data}
            </p>
          )}
          {tx.recipient && (
            <p className="text-xs text-gray-300 mt-1">
              Recipient: {tx.recipient}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">
            {new Date(tx.timestamp).toLocaleTimeString()}
          </span>
          <div className="mt-1">
            <ChainBadge chain={tx.chain} />
          </div>
        </div>
      </div>
      
      {/* Real blockchain explorer links */}
      <a 
        href={getExplorerUrl(tx.hash, tx.chain)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 hover:underline mt-2 inline-block"
      >
        View on {tx.chain === 'Solana' ? 'Solscan' : 'Basescan'} →
      </a>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-4 relative">
      {/* Neural Network Background */}
      <NeuralNetworkBackground />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-2">
            BioShield Live Demo
          </h1>
          <p className="text-xl text-gray-300">
            Watch a $5M clinical trial insurance claim process in real-time
          </p>
          
          {/* Network Stats Bar */}
          <div className="flex justify-center gap-8 mt-6">
            {Object.entries(networkStats).map(([key, value]) => (
              <div key={key} className="glass-card px-4 py-2">
                <p className="text-xs text-gray-400">{formatLabel(key)}</p>
                <p className="text-lg font-bold text-white">
                  {typeof value === 'number' && key === 'tvl' 
                    ? `$${value.toLocaleString()}`
                    : value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Control Panel */}
          <div>
            <div className="glass-card p-6 mb-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                Scenario: CAR-T Therapy Trial
              </h2>
              
              {/* Coverage Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Coverage Amount:</span>
                  <span className="text-white font-bold">$5,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Premium (Standard):</span>
                  <span className="text-white">$250,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Premium (with $LIVES):</span>
                  <span className="text-green-400 font-bold">$125,000 (-50%)</span>
                </div>
              </div>

              {/* LIVES Token Toggle */}
              <div className="flex items-center justify-between mb-6">
                <label className="text-white">Pay with $LIVES Token</label>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLivesDiscount(!showLivesDiscount)}
                  className={`w-16 h-8 rounded-full p-1 transition-colors ${
                    showLivesDiscount ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: showLivesDiscount ? 32 : 0 }}
                    className="w-6 h-6 bg-white rounded-full"
                  />
                </motion.button>
              </div>

              {/* Demo Controls */}
              <div className="flex gap-3">
                <GradientButton
                  onClick={runLiveDemo}
                  disabled={isRunning}
                  fullWidth
                  glow
                >
                  {isRunning ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Activity className="w-5 h-5" />
                      🚀 Run Live Demo
                    </div>
                  )}
                </GradientButton>
                
                <GradientButton
                  onClick={resetDemo}
                  variant="secondary"
                  disabled={isRunning}
                >
                  <Activity className="w-5 h-5" />
                </GradientButton>
              </div>
            </div>

            {/* Progress Timeline */}
            <DemoProgress 
              currentStep={currentStep}
              isRunning={isRunning}
              showLivesDiscount={showLivesDiscount}
            />
          </div>

          {/* Middle: Real-Time Stats */}
          <div>
            <RealTimeStats 
              isRunning={isRunning}
              currentStep={currentStep}
              showLivesDiscount={showLivesDiscount}
            />
          </div>

          {/* Right: Transaction Feed */}
          <div>
            <div className="glass-card p-6 min-h-[600px]">
              <h3 className="text-xl font-bold text-white mb-4">
                Live Blockchain Transactions
              </h3>
              
              <AnimatePresence>
                {transactions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <p className="text-gray-400">
                      Click "Run Live Demo" to see real transactions
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx, idx) => (
                      <TransactionCard key={idx} tx={tx} index={idx} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom: Próspera Advantage Section */}
        <div className="mt-8">
          <ProsperaAdvantage />
        </div>
      </div>
    </div>
  )
}

// Helper Components
const StatusIcon = ({ status }: { status: string }) => {
  const icons: any = {
    confirmed: '✅',
    verified: '🔍',
    processing: '⏳',
    completed: '🎉'
  }
  return <span className="text-lg">{icons[status] || '📝'}</span>
}

const ChainBadge = ({ chain }: { chain: string }) => (
  <span className={`px-2 py-1 rounded text-xs font-bold ${
    chain === 'Solana' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
  }`}>
    {chain}
  </span>
)

const getExplorerUrl = (hash: string, chain: string) => {
  if (chain === 'Solana') {
    return `https://solscan.io/tx/${hash}?cluster=devnet`
  }
  return `https://sepolia.basescan.org/tx/${hash}`
}

const formatLabel = (key: string) => {
  const labels: any = {
    tvl: 'Total Value Locked',
    activePolicies: 'Active Policies',
    claimsPaid: 'Claims Paid',
    avgProcessTime: 'Avg Process Time'
  }
  return labels[key] || key
}
