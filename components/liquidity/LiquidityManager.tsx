'use client'

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useLiquidity } from '@/hooks/useLiquidity'
import { useInsurancePool } from '@/hooks/useInsurancePool'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Droplets, TrendingUp, DollarSign, Award, Plus, Minus, Gift, Info, AlertTriangle } from 'lucide-react'
import BN from 'bn.js'
import toast from 'react-hot-toast'

export function LiquidityManager() {
  const {
    addLiquidity,
    removeLiquidity,
    claimRewards,
    liquidityMetrics,
    userLiquidityInfo,
    loading,
    connected,
    calculateLiquidityValueUSD,
    canRemoveLiquidity,
    isLiquidityProvider,
    estimatedAPR,
  } = useLiquidity()

  const { poolData } = useInsurancePool()

  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'remove'>('overview')
  const [addForm, setAddForm] = useState({
    amount: 0,
    tokenMint: '',
    useSOL: true,
  })
  const [removeForm, setRemoveForm] = useState({
    shieldAmount: 0,
    tokenMint: '',
  })

  const handleAddLiquidity = async () => {
    if (addForm.amount <= 0) {
      toast.error('Amount must be positive')
      return
    }

    try {
      let tokenMint: PublicKey

      if (addForm.useSOL) {
        // Para SOL, usar WSOL o manejar directamente
        tokenMint = new PublicKey('So11111111111111111111111111111111111111112') // WSOL
      } else {
        if (!addForm.tokenMint) {
          toast.error('Please specify token mint address')
          return
        }
        tokenMint = new PublicKey(addForm.tokenMint)
      }

      await addLiquidity({
        amount: new BN(addForm.amount * 1_000_000_000),
        tokenMint,
        useSOL: addForm.useSOL,
      })

      // Reset form
      setAddForm({ amount: 0, tokenMint: '', useSOL: true })
      setActiveTab('overview')

    } catch (error) {
      console.error('Error adding liquidity:', error)
    }
  }

  const handleRemoveLiquidity = async () => {
    if (removeForm.shieldAmount <= 0) {
      toast.error('Amount must be positive')
      return
    }

    if (!removeForm.tokenMint) {
      toast.error('Please specify token mint address')
      return
    }

    try {
      await removeLiquidity({
        shieldTokenAmount: new BN(removeForm.shieldAmount * 1_000_000_000),
        tokenMint: new PublicKey(removeForm.tokenMint),
      })

      // Reset form
      setRemoveForm({ shieldAmount: 0, tokenMint: '' })
      setActiveTab('overview')

    } catch (error) {
      console.error('Error removing liquidity:', error)
    }
  }

  const handleClaimRewards = async () => {
    try {
      await claimRewards()
    } catch (error) {
      console.error('Error claiming rewards:', error)
    }
  }

  if (!connected) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Wallet Not Connected
        </h3>
        <p className="text-text-secondary">
          Please connect your wallet to manage liquidity
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Liquidity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <Droplets className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {liquidityMetrics ? `$${(liquidityMetrics.totalLiquidity.toNumber() / 1_000_000_000 * 100).toLocaleString()}` : '$0'}
              </div>
              <div className="text-sm text-text-secondary">Total Liquidity</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {estimatedAPR.toFixed(1)}%
              </div>
              <div className="text-sm text-text-secondary">Current APR</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {liquidityMetrics?.yourShare.toFixed(2) || '0.00'}%
              </div>
              <div className="text-sm text-text-secondary">Your Share</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {liquidityMetrics ? `$${calculateLiquidityValueUSD(liquidityMetrics.pendingRewards).toFixed(2)}` : '$0.00'}
              </div>
              <div className="text-sm text-text-secondary">Pending Rewards</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* User Position (if provider) */}
      {isLiquidityProvider && userLiquidityInfo && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-text-primary">Your Liquidity Position</h3>
            </div>
            <GradientButton
              onClick={handleClaimRewards}
              loading={loading}
              size="sm"
              disabled={!liquidityMetrics?.pendingRewards.gt(new BN(0))}
            >
              <Gift className="w-4 h-4 mr-2" />
              Claim Rewards
            </GradientButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-text-secondary">Liquidity Provided:</span>
                <div className="text-lg font-semibold text-text-primary">
                  {(userLiquidityInfo.totalProvided.toNumber() / 1_000_000_000).toFixed(4)} SOL
                </div>
                <div className="text-sm text-text-secondary">
                  ≈ ${calculateLiquidityValueUSD(userLiquidityInfo.totalProvided).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-text-secondary">SHIELD Tokens:</span>
                <div className="text-lg font-semibold text-text-primary">
                  {(userLiquidityInfo.shieldTokensOwned.toNumber() / 1_000_000_000).toFixed(4)} SHIELD
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-text-secondary">Last Reward:</span>
                <div className="text-lg font-semibold text-success">
                  {(userLiquidityInfo.lastReward.toNumber() / 1_000_000_000).toFixed(6)} SOL
                </div>
                <div className="text-sm text-text-secondary">
                  Joined {new Date(userLiquidityInfo.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'add'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'remove'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          disabled={!canRemoveLiquidity()}
        >
          Remove Liquidity
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Pool Information */}
          <GlassCard className="p-6">
            <div className="flex items-center mb-6">
              <Info className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">Pool Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-text-secondary">Total Value Locked:</span>
                  <div className="text-lg font-semibold text-text-primary">
                    {liquidityMetrics ? `$${(liquidityMetrics.totalLiquidity.toNumber() / 1_000_000_000 * 100).toLocaleString()}` : '$0'}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Utilization Rate:</span>
                  <div className="text-lg font-semibold text-text-primary">
                    {liquidityMetrics?.utilizationRate.toFixed(1) || '0.0'}%
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-text-secondary">Total Providers:</span>
                  <div className="text-lg font-semibold text-text-primary">
                    {liquidityMetrics?.totalProviders || 0}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Pool Status:</span>
                  <div className={`text-lg font-semibold ${poolData?.isPaused ? 'text-red-500' : 'text-green-500'}`}>
                    {poolData?.isPaused ? 'Paused' : 'Active'}
                  </div>
                </div>
              </div>
            </div>

            {/* APR Breakdown */}
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <h4 className="font-semibold text-text-primary mb-3">APR Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Base APR:</span>
                  <span className="text-text-primary">8.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Utilization Bonus:</span>
                  <span className="text-text-primary">
                    +{((estimatedAPR - 8)).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-text-primary font-semibold">Total APR:</span>
                  <span className="text-green-500 font-semibold">{estimatedAPR.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Getting Started */}
          {!isLiquidityProvider && (
            <GlassCard className="p-6">
              <div className="text-center">
                <Droplets className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  Start Earning with Liquidity Provision
                </h3>
                <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                  Provide liquidity to the BioShields insurance pool and earn competitive yields
                  while supporting the DeSci ecosystem. Your liquidity helps fund insurance payouts
                  and you earn a share of the protocol fees.
                </p>
                <GradientButton
                  onClick={() => setActiveTab('add')}
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Liquidity
                </GradientButton>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Add Liquidity Tab */}
      {activeTab === 'add' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Plus className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">Add Liquidity</h3>
            </div>

            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Token Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={addForm.useSOL}
                    onChange={(e) => setAddForm(prev => ({ ...prev, useSOL: e.target.checked }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-text-primary">SOL</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!addForm.useSOL}
                    onChange={(e) => setAddForm(prev => ({ ...prev, useSOL: !e.target.checked }))}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-text-primary">SPL Token</span>
                </label>
              </div>
            </div>

            {/* Token Mint (if not SOL) */}
            {!addForm.useSOL && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Token Mint Address
                </label>
                <input
                  type="text"
                  value={addForm.tokenMint}
                  onChange={(e) => setAddForm(prev => ({ ...prev, tokenMint: e.target.value }))}
                  placeholder="Enter token mint address"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Amount {addForm.useSOL ? '(SOL)' : '(Tokens)'}
              </label>
              <input
                type="number"
                value={addForm.amount}
                onChange={(e) => setAddForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                min="0"
                step="0.001"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Estimated Returns */}
            {addForm.amount > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-300 mb-2">Estimated Returns</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-200">Current APR:</span>
                    <span className="text-green-100 font-semibold">{estimatedAPR.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-200">Monthly Rewards (est):</span>
                    <span className="text-green-100 font-semibold">
                      {(addForm.amount * estimatedAPR / 100 / 12).toFixed(4)} {addForm.useSOL ? 'SOL' : 'Tokens'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-200">SHIELD Tokens (est):</span>
                    <span className="text-green-100 font-semibold">
                      {addForm.amount.toFixed(4)} SHIELD
                    </span>
                  </div>
                </div>
              </div>
            )}

            <GradientButton
              onClick={handleAddLiquidity}
              loading={loading}
              disabled={addForm.amount <= 0 || (!addForm.useSOL && !addForm.tokenMint)}
              fullWidth
              size="lg"
            >
              Add Liquidity
            </GradientButton>
          </div>
        </GlassCard>
      )}

      {/* Remove Liquidity Tab */}
      {activeTab === 'remove' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Minus className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">Remove Liquidity</h3>
            </div>

            {canRemoveLiquidity() ? (
              <>
                {/* SHIELD Amount */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    SHIELD Tokens to Burn
                  </label>
                  <input
                    type="number"
                    value={removeForm.shieldAmount}
                    onChange={(e) => setRemoveForm(prev => ({ ...prev, shieldAmount: parseFloat(e.target.value) }))}
                    min="0"
                    max={userLiquidityInfo ? userLiquidityInfo.shieldTokensOwned.toNumber() / 1_000_000_000 : 0}
                    step="0.001"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="text-sm text-text-secondary mt-1">
                    Available: {userLiquidityInfo ? (userLiquidityInfo.shieldTokensOwned.toNumber() / 1_000_000_000).toFixed(4) : '0'} SHIELD
                  </div>
                </div>

                {/* Token Mint */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Token to Receive
                  </label>
                  <input
                    type="text"
                    value={removeForm.tokenMint}
                    onChange={(e) => setRemoveForm(prev => ({ ...prev, tokenMint: e.target.value }))}
                    placeholder="Enter token mint address"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <GradientButton
                  onClick={handleRemoveLiquidity}
                  loading={loading}
                  disabled={removeForm.shieldAmount <= 0 || !removeForm.tokenMint}
                  fullWidth
                  size="lg"
                  variant="secondary"
                >
                  Remove Liquidity
                </GradientButton>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-text-primary mb-2">
                  Cannot Remove Liquidity
                </h4>
                <p className="text-text-secondary">
                  {poolData?.isPaused
                    ? 'The pool is currently paused'
                    : 'You don\'t have any SHIELD tokens to burn'
                  }
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  )
}