import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ComprehensiveDashboard } from '@/components/dashboard/ComprehensiveDashboard'
import { useInsurancePool } from '@/hooks/useInsurancePool'
import { useCoverage } from '@/hooks/useCoverage'
import { useClaims } from '@/hooks/useClaims'
import { useLiquidity } from '@/hooks/useLiquidity'
import BN from 'bn.js'
import { PublicKey } from '@solana/web3.js'

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => (
    <div data-testid={`link-${href.replace('/', '')}`}>{children}</div>
  )
})

// Mock the hooks
jest.mock('@/hooks/useInsurancePool')
jest.mock('@/hooks/useCoverage')
jest.mock('@/hooks/useClaims')
jest.mock('@/hooks/useLiquidity')

const mockUseInsurancePool = useInsurancePool as jest.MockedFunction<typeof useInsurancePool>
const mockUseCoverage = useCoverage as jest.MockedFunction<typeof useCoverage>
const mockUseClaims = useClaims as jest.MockedFunction<typeof useClaims>
const mockUseLiquidity = useLiquidity as jest.MockedFunction<typeof useLiquidity>

describe('ComprehensiveDashboard', () => {
  const mockPoolData = {
    authority: new PublicKey('11111111111111111111111111111111'),
    totalValueLocked: new BN(2800000 * 1000000000), // 2.8M SOL
    totalCoverageAmount: new BN(2100000 * 1000000000), // 2.1M SOL coverage
    livesTokenMint: new PublicKey('11111111111111111111111111111111'),
    shieldTokenMint: new PublicKey('11111111111111111111111111111111'),
    isPaused: false,
    feeRate: 300, // 3%
    minCoveragePeriod: 86400, // 1 day
    maxCoveragePeriod: 31536000, // 1 year
  }

  const mockPoolMetrics = {
    totalValueLocked: 2800000,
    activePolicies: 156,
    totalClaims: 38,
    averageApy: 13.1,
    averageClaimTime: '2.4h',
    utilizationRate: 75.0,
  }

  const mockUserCoverages = [
    {
      id: new PublicKey('11111111111111111111111111111111'),
      authority: new PublicKey('22222222222222222222222222222222'),
      coverageAmount: new BN(5000 * 1000000000),
      premium: new BN(250 * 1000000000),
      coverageType: 0,
      startTime: new BN(Date.now() / 1000),
      endTime: new BN(Date.now() / 1000 + 86400 * 30),
      isActive: true,
      riskCategory: 1,
      maxClaimAmount: new BN(5000 * 1000000000),
      triggerConditions: { threshold: 100, dataSource: 'oracle1' },
    }
  ]

  const mockUserClaims = [
    {
      id: new PublicKey('11111111111111111111111111111111'),
      coverage: new PublicKey('22222222222222222222222222222222'),
      claimant: new PublicKey('33333333333333333333333333333333'),
      amount: new BN(2500 * 1000000000),
      status: 1, // Approved
      submissionTime: new BN(Date.now() / 1000 - 86400),
      evidence: 'Test evidence',
      verificationData: { temperature: 25.5, timestamp: Date.now() },
    }
  ]

  const mockLiquidityMetrics = {
    totalLiquidity: new BN(2800000 * 1000000000),
    apr: 15.5,
    utilizationRate: 75.0,
    totalProviders: 45,
    yourShare: 2.5,
    pendingRewards: new BN(150 * 1000000000 / 1000),
  }

  const mockUserLiquidityInfo = {
    address: new PublicKey('11111111111111111111111111111111'),
    totalProvided: new BN(5000 * 1000000000),
    shieldTokensOwned: new BN(4800 * 1000000000),
    joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastReward: new BN(25 * 1000000000 / 1000),
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup default mock implementations
    mockUseInsurancePool.mockReturnValue({
      poolData: mockPoolData,
      poolMetrics: mockPoolMetrics,
      isPoolAuthority: false,
      loading: false,
      connected: true,
      initializePool: jest.fn(),
      pausePool: jest.fn(),
      unpausePool: jest.fn(),
      fetchPoolData: jest.fn(),
      calculatePoolMetrics: jest.fn(),
      getPoolAddress: jest.fn(),
    })

    mockUseCoverage.mockReturnValue({
      userCoverages: mockUserCoverages,
      activeCoveragesCount: 1,
      totalCoverageValue: new BN(5000 * 1000000000),
      loading: false,
      connected: true,
      createCoverage: jest.fn(),
      updateCoverage: jest.fn(),
      cancelCoverage: jest.fn(),
      fetchUserCoverages: jest.fn(),
      calculatePremium: jest.fn(),
      hasActiveCoverage: true,
    })

    mockUseClaims.mockReturnValue({
      userClaims: mockUserClaims,
      pendingClaimsCount: 0,
      totalClaimedAmount: new BN(2500 * 1000000000),
      loading: false,
      connected: true,
      submitClaim: jest.fn(),
      processClaimAsOracle: jest.fn(),
      fetchUserClaims: jest.fn(),
      canSubmitClaim: true,
      estimatedProcessingTime: '2-4 hours',
    })

    mockUseLiquidity.mockReturnValue({
      liquidityMetrics: mockLiquidityMetrics,
      userLiquidityInfo: mockUserLiquidityInfo,
      loading: false,
      connected: true,
      addLiquidity: jest.fn(),
      removeLiquidity: jest.fn(),
      claimRewards: jest.fn(),
      fetchLiquidityMetrics: jest.fn(),
      fetchUserLiquidityInfo: jest.fn(),
      calculateShieldTokens: jest.fn(),
      calculateCurrentAPR: jest.fn().mockReturnValue(15.5),
      calculateLiquidityValueUSD: jest.fn(),
      canRemoveLiquidity: jest.fn().mockReturnValue(true),
      userSharePercentage: 2.5,
      estimatedAPR: 15.5,
      isLiquidityProvider: true,
    })
  })

  it('renders dashboard with key metrics', () => {
    render(<ComprehensiveDashboard />)

    // Check key metrics are displayed
    expect(screen.getByText('BioShields Dashboard')).toBeInTheDocument()
    expect(screen.getByText('$2800K')).toBeInTheDocument() // TVL
    expect(screen.getByText('156')).toBeInTheDocument() // Active Policies
    expect(screen.getByText('13.1%')).toBeInTheDocument() // APY
    expect(screen.getByText('38')).toBeInTheDocument() // Claims Processed
  })

  it('displays user portfolio information correctly', () => {
    render(<ComprehensiveDashboard />)

    // Check coverage section
    expect(screen.getByText('Your Coverages')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // Active policies
    expect(screen.getByText('5.00 SOL')).toBeInTheDocument() // Total coverage

    // Check claims section
    expect(screen.getByText('Your Claims')).toBeInTheDocument()
    expect(screen.getByText('0.0025 SOL')).toBeInTheDocument() // Total claimed

    // Check liquidity section
    expect(screen.getByText('Your Liquidity')).toBeInTheDocument()
    expect(screen.getByText('5.00 SOL')).toBeInTheDocument() // Provided liquidity
    expect(screen.getByText('15.5%')).toBeInTheDocument() // Current APR
  })

  it('handles timeframe selection', () => {
    render(<ComprehensiveDashboard />)

    const timeframeButtons = ['24h', '7d', '30d', '90d']

    timeframeButtons.forEach(period => {
      const button = screen.getByText(period)
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(button).toHaveClass('bg-primary')
    })
  })

  it('handles metric selection for historical chart', () => {
    render(<ComprehensiveDashboard />)

    const metricButtons = ['TVL', 'CLAIMS', 'APY']

    metricButtons.forEach(metric => {
      const button = screen.getByText(metric)
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(button).toHaveClass('bg-primary')
    })
  })

  it('displays quick action links', () => {
    render(<ComprehensiveDashboard />)

    // Check quick action cards
    expect(screen.getByTestId('link-marketplace')).toBeInTheDocument()
    expect(screen.getByTestId('link-claims')).toBeInTheDocument()
    expect(screen.getByTestId('link-pools')).toBeInTheDocument()
    expect(screen.getByTestId('link-governance')).toBeInTheDocument()
  })

  it('displays protocol health metrics', () => {
    render(<ComprehensiveDashboard />)

    expect(screen.getByText('Protocol Health')).toBeInTheDocument()
    expect(screen.getByText('95.2%')).toBeInTheDocument() // Claim Success Rate
    expect(screen.getByText('75.0%')).toBeInTheDocument() // Pool Utilization
    expect(screen.getByText('AAA')).toBeInTheDocument() // Security Rating
    expect(screen.getByText('99.9%')).toBeInTheDocument() // Uptime
  })

  it('handles loading states correctly', () => {
    // Mock loading state
    mockUseInsurancePool.mockReturnValue({
      poolData: null,
      poolMetrics: null,
      isPoolAuthority: false,
      loading: true,
      connected: true,
      initializePool: jest.fn(),
      pausePool: jest.fn(),
      unpausePool: jest.fn(),
      fetchPoolData: jest.fn(),
      calculatePoolMetrics: jest.fn(),
      getPoolAddress: jest.fn(),
    })

    render(<ComprehensiveDashboard />)

    // Should display fallback values during loading
    expect(screen.getByText('$0K')).toBeInTheDocument()
  })

  it('handles user with no liquidity provided', () => {
    mockUseLiquidity.mockReturnValue({
      liquidityMetrics: mockLiquidityMetrics,
      userLiquidityInfo: null,
      loading: false,
      connected: true,
      addLiquidity: jest.fn(),
      removeLiquidity: jest.fn(),
      claimRewards: jest.fn(),
      fetchLiquidityMetrics: jest.fn(),
      fetchUserLiquidityInfo: jest.fn(),
      calculateShieldTokens: jest.fn(),
      calculateCurrentAPR: jest.fn().mockReturnValue(15.5),
      calculateLiquidityValueUSD: jest.fn(),
      canRemoveLiquidity: jest.fn().mockReturnValue(false),
      userSharePercentage: 0,
      estimatedAPR: 15.5,
      isLiquidityProvider: false,
    })

    render(<ComprehensiveDashboard />)

    expect(screen.getByText('No liquidity provided')).toBeInTheDocument()
    expect(screen.getByText('Add Liquidity')).toBeInTheDocument()
  })

  it('renders charts without errors', async () => {
    render(<ComprehensiveDashboard />)

    // Wait for charts to render
    await waitFor(() => {
      expect(screen.getByText('Historical Performance')).toBeInTheDocument()
      expect(screen.getByText('Coverage Distribution')).toBeInTheDocument()
      expect(screen.getByText('Claims Processing Overview')).toBeInTheDocument()
    })

    // Check distribution legend
    expect(screen.getByText('Clinical Trials')).toBeInTheDocument()
    expect(screen.getByText('Regulatory')).toBeInTheDocument()
    expect(screen.getByText('IP Protection')).toBeInTheDocument()
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
  })

  it('displays correct percentage changes', () => {
    render(<ComprehensiveDashboard />)

    // Check that percentage changes are displayed with correct colors
    const positiveChanges = screen.getAllByText(/\d+\.\d+% vs last period/)
    expect(positiveChanges.length).toBeGreaterThan(0)
  })

  it('handles disconnected wallet state', () => {
    mockUseInsurancePool.mockReturnValue({
      poolData: null,
      poolMetrics: null,
      isPoolAuthority: false,
      loading: false,
      connected: false,
      initializePool: jest.fn(),
      pausePool: jest.fn(),
      unpausePool: jest.fn(),
      fetchPoolData: jest.fn(),
      calculatePoolMetrics: jest.fn(),
      getPoolAddress: jest.fn(),
    })

    render(<ComprehensiveDashboard />)

    // Should still render basic structure
    expect(screen.getByText('BioShields Dashboard')).toBeInTheDocument()
  })
})