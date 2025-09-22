'use client'

import { useState, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useClaims } from '@/hooks/useClaims'
import { useCoverage } from '@/hooks/useCoverage'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { ClaimType, ClaimStatus, CoverageAccount } from '@/lib/solana/types'
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, Upload, Eye } from 'lucide-react'
import BN from 'bn.js'
import toast from 'react-hot-toast'

interface ClaimsManagerProps {
  coverageAddress?: PublicKey
}

export function ClaimsManager({ coverageAddress }: ClaimsManagerProps) {
  const {
    submitClaim,
    userClaims,
    loading,
    connected,
    getClaimsByStatus,
    getTotalClaimedAmount,
    isClaimPending,
  } = useClaims()

  const { userCoverages, isCoverageActive } = useCoverage()

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageAccount | null>(null)

  const [claimForm, setClaimForm] = useState({
    coverageAddress: '',
    claimAmount: 0,
    claimType: ClaimType.FullCoverage,
    evidence: '',
    description: '',
  })

  // Auto-seleccionar cobertura si se proporciona
  useEffect(() => {
    if (coverageAddress && userCoverages.length > 0) {
      const coverage = userCoverages.find(c =>
        new PublicKey(c.address || c.publicKey || c.key).equals(coverageAddress)
      )
      if (coverage) {
        setSelectedCoverage(coverage)
        setClaimForm(prev => ({ ...prev, coverageAddress: coverageAddress.toString() }))
      }
    }
  }, [coverageAddress, userCoverages])

  const handleClaimSubmit = async () => {
    if (!selectedCoverage) {
      toast.error('Please select a coverage')
      return
    }

    if (claimForm.claimAmount <= 0) {
      toast.error('Claim amount must be positive')
      return
    }

    if (!claimForm.evidence.trim()) {
      toast.error('Evidence is required')
      return
    }

    try {
      await submitClaim({
        coverageAddress: new PublicKey(claimForm.coverageAddress),
        claimAmount: new BN(claimForm.claimAmount * 1_000_000_000),
        claimType: claimForm.claimType,
        evidence: claimForm.evidence,
        description: claimForm.description,
      })

      // Reset form
      setClaimForm({
        coverageAddress: '',
        claimAmount: 0,
        claimType: ClaimType.FullCoverage,
        evidence: '',
        description: '',
      })
      setActiveTab('list')

    } catch (error) {
      console.error('Error submitting claim:', error)
    }
  }

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Pending:
        return <Clock className="w-4 h-4 text-yellow-500" />
      case ClaimStatus.UnderReview:
        return <AlertTriangle className="w-4 h-4 text-blue-500" />
      case ClaimStatus.Approved:
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case ClaimStatus.Rejected:
        return <XCircle className="w-4 h-4 text-red-500" />
      case ClaimStatus.Paid:
        return <DollarSign className="w-4 h-4 text-green-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Pending:
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case ClaimStatus.UnderReview:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      case ClaimStatus.Approved:
        return 'text-green-500 bg-green-500/10 border-green-500/20'
      case ClaimStatus.Rejected:
        return 'text-red-500 bg-red-500/10 border-red-500/20'
      case ClaimStatus.Paid:
        return 'text-green-600 bg-green-600/10 border-green-600/20'
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
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
          Please connect your wallet to manage claims
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-bold text-text-primary">{userClaims.length}</div>
              <div className="text-sm text-text-secondary">Total Claims</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {getClaimsByStatus(ClaimStatus.Pending).length}
              </div>
              <div className="text-sm text-text-secondary">Pending</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {getClaimsByStatus(ClaimStatus.Approved).length + getClaimsByStatus(ClaimStatus.Paid).length}
              </div>
              <div className="text-sm text-text-secondary">Approved</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-success" />
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {(getTotalClaimedAmount().toNumber() / 1_000_000_000).toFixed(2)}
              </div>
              <div className="text-sm text-text-secondary">SOL Claimed</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'list'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          My Claims
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Submit New Claim
        </button>
      </div>

      {/* Claims List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {userClaims.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text-primary mb-2">
                No Claims Found
              </h3>
              <p className="text-text-secondary mb-6">
                You haven't submitted any claims yet
              </p>
              <GradientButton onClick={() => setActiveTab('create')}>
                Submit Your First Claim
              </GradientButton>
            </GlassCard>
          ) : (
            userClaims.map((claim, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(claim.status)}
                      <h3 className="text-lg font-semibold text-text-primary">
                        Claim #{index + 1}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-text-secondary">Amount:</span>
                        <div className="font-semibold text-text-primary">
                          {(claim.claimAmount.toNumber() / 1_000_000_000).toFixed(4)} SOL
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-text-secondary">Type:</span>
                        <div className="font-semibold text-text-primary">
                          {claim.claimType}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-text-secondary">Submitted:</span>
                        <div className="font-semibold text-text-primary">
                          {new Date(claim.submittedAt.toNumber() * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {claim.processedAt && (
                      <div className="text-sm text-text-secondary">
                        Processed: {new Date(claim.processedAt.toNumber() * 1000).toLocaleDateString()}
                      </div>
                    )}

                    {claim.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="text-sm text-red-300">
                          <strong>Rejection Reason:</strong> {claim.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      className="p-2 text-text-secondary hover:text-primary transition-colors"
                      title="View Evidence"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Create Claim Form */}
      {activeTab === 'create' && (
        <GlassCard className="p-8">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-primary mr-3" />
              <h3 className="text-xl font-bold text-text-primary">
                Submit New Claim
              </h3>
            </div>

            {/* Coverage Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Coverage *
              </label>
              <select
                value={claimForm.coverageAddress}
                onChange={(e) => {
                  setClaimForm(prev => ({ ...prev, coverageAddress: e.target.value }))
                  const coverage = userCoverages.find(c =>
                    new PublicKey(c.address || c.publicKey || c.key).toString() === e.target.value
                  )
                  setSelectedCoverage(coverage || null)
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a coverage...</option>
                {userCoverages.filter(isCoverageActive).map((coverage, index) => (
                  <option
                    key={index}
                    value={new PublicKey(coverage.address || coverage.publicKey || coverage.key).toString()}
                  >
                    {coverage.coverageType} - {(coverage.coverageAmount.toNumber() / 1_000_000_000).toFixed(2)} SOL
                  </option>
                ))}
              </select>
            </div>

            {selectedCoverage && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-300 mb-2">Coverage Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-200">Total Coverage:</span>
                    <div className="font-semibold text-blue-100">
                      {(selectedCoverage.coverageAmount.toNumber() / 1_000_000_000).toFixed(2)} SOL
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-200">Remaining:</span>
                    <div className="font-semibold text-blue-100">
                      {((selectedCoverage.coverageAmount.toNumber() - selectedCoverage.totalClaimed.toNumber()) / 1_000_000_000).toFixed(2)} SOL
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Claim Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Claim Amount (SOL) *
                </label>
                <input
                  type="number"
                  value={claimForm.claimAmount}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, claimAmount: parseFloat(e.target.value) }))}
                  min="0"
                  step="0.001"
                  max={selectedCoverage ? (selectedCoverage.coverageAmount.toNumber() - selectedCoverage.totalClaimed.toNumber()) / 1_000_000_000 : undefined}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Claim Type *
                </label>
                <select
                  value={claimForm.claimType}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, claimType: e.target.value as ClaimType }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={ClaimType.FullCoverage}>Full Coverage</option>
                  <option value={ClaimType.PartialCoverage}>Partial Coverage</option>
                  <option value={ClaimType.Milestone}>Milestone Claim</option>
                </select>
              </div>
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Evidence (URL or IPFS Hash) *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={claimForm.evidence}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, evidence: e.target.value }))}
                  placeholder="https://... or ipfs://..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-secondary hover:text-primary transition-colors"
                  title="Upload to IPFS"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={claimForm.description}
                onChange={(e) => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Provide additional context for your claim..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <GradientButton
                onClick={handleClaimSubmit}
                loading={loading}
                disabled={!selectedCoverage || claimForm.claimAmount <= 0 || !claimForm.evidence.trim()}
                size="lg"
              >
                Submit Claim
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}