'use client'

import { useState, useEffect } from 'react'
import { useInsurancePool } from '@/hooks/useInsurancePool'
import { useCoverage } from '@/hooks/useCoverage'
import { useClaims } from '@/hooks/useClaims'
import { useLiquidity } from '@/hooks/useLiquidity'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import {
  Shield, TrendingUp, DollarSign, Users, Activity, Clock,
  AlertTriangle, CheckCircle, BarChart3, PieChart,
  ArrowDown, Zap, Award, Target
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

// Mock data para gráficos (en producción vendría de la blockchain)
const historicalData = [
  { date: '2025-09-01', tvl: 1800000, claims: 15, apy: 12.2 },
  { date: '2025-09-05', tvl: 2100000, claims: 18, apy: 12.5 },
  { date: '2025-09-10', tvl: 2400000, claims: 23, apy: 12.8 },
  { date: '2025-09-15', tvl: 2800000, claims: 28, apy: 13.1 },
]

const coverageDistribution = [
  { name: 'Clinical Trials', value: 45, color: '#7c3aed' },
  { name: 'Regulatory', value: 25, color: '#06b6d4' },
  { name: 'IP Protection', value: 20, color: '#10b981' },
  { name: 'Infrastructure', value: 10, color: '#f59e0b' },
]

const claimsStatusData = [
  { status: 'Pending', count: 8, color: '#f59e0b' },
  { status: 'Approved', count: 15, color: '#10b981' },
  { status: 'Rejected', count: 3, color: '#ef4444' },
  { status: 'Paid', count: 12, color: '#06b6d4' },
]

export function ComprehensiveDashboard() {
  const { poolData, poolMetrics, isPoolAuthority } = useInsurancePool()
  const { userCoverages, activeCoveragesCount, totalCoverageValue } = useCoverage()
  const { userClaims, pendingClaimsCount, totalClaimedAmount } = useClaims()
  const { liquidityMetrics, userLiquidityInfo, isLiquidityProvider } = useLiquidity()

  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'tvl' | 'claims' | 'apy'>('tvl')

  // Calcular cambios porcentuales (mock)
  const calculateChange = (current: number, previous: number): { value: number, positive: boolean } => {
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(change), positive: change >= 0 }
  }

  const tvlChange = calculateChange(2800000, 2400000)
  const apyChange = calculateChange(13.1, 12.8)
  const claimsChange = calculateChange(28, 23)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            BioShields Dashboard
          </h1>
          <p className="text-text-secondary">
            Real-time metrics and insights for the DeSci insurance protocol
          </p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeframe === period
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-text-primary">
                ${poolMetrics ? (poolMetrics.totalValueLocked / 1000).toFixed(0) : '0'}K
              </div>
              <div className="text-sm text-text-secondary">Total Value Locked</div>
              <div className={`flex items-center text-xs mt-1 ${tvlChange.positive ? 'text-green-500' : 'text-red-500'}`}>
                {tvlChange.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {tvlChange.value.toFixed(1)}% vs last period
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {poolMetrics?.activePolicies || activeCoveragesCount}
              </div>
              <div className="text-sm text-text-secondary">Active Policies</div>
              <div className="flex items-center text-xs mt-1 text-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                12.5% growth
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {poolMetrics?.averageApy.toFixed(1) || '12.5'}%
              </div>
              <div className="text-sm text-text-secondary">Average APY</div>
              <div className={`flex items-center text-xs mt-1 ${apyChange.positive ? 'text-green-500' : 'text-red-500'}`}>
                {apyChange.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {apyChange.value.toFixed(1)}% change
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {poolMetrics?.totalClaims || userClaims.length}
              </div>
              <div className="text-sm text-text-secondary">Claims Processed</div>
              <div className={`flex items-center text-xs mt-1 ${claimsChange.positive ? 'text-green-500' : 'text-red-500'}`}>
                {claimsChange.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {claimsChange.value.toFixed(1)}% change
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* User Quick Actions */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text-primary">Quick Actions</h3>
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Target className="w-4 h-4" />
            <span>Personalized for your portfolio</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/marketplace">
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg hover:border-primary/40 transition-colors cursor-pointer">
              <Shield className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-semibold text-text-primary mb-1">Create Coverage</h4>
              <p className="text-sm text-text-secondary">Protect your research projects</p>
            </div>
          </Link>

          <Link href="/claims">
            <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-colors cursor-pointer">
              <Activity className="w-8 h-8 text-yellow-500 mb-3" />
              <h4 className="font-semibold text-text-primary mb-1">Submit Claim</h4>
              <p className="text-sm text-text-secondary">File an insurance claim</p>
            </div>
          </Link>

          <Link href="/pools">
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-colors cursor-pointer">
              <DollarSign className="w-8 h-8 text-green-500 mb-3" />
              <h4 className="font-semibold text-text-primary mb-1">Add Liquidity</h4>
              <p className="text-sm text-text-secondary">Earn yield by providing liquidity</p>
            </div>
          </Link>

          <Link href="/governance">
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-colors cursor-pointer">
              <Users className="w-8 h-8 text-purple-500 mb-3" />
              <h4 className="font-semibold text-text-primary mb-1">Governance</h4>
              <p className="text-sm text-text-secondary">Participate in protocol decisions</p>
            </div>
          </Link>
        </div>
      </GlassCard>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TVL Historical Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary">Historical Performance</h3>
            <div className="flex space-x-2">
              {['tvl', 'claims', 'apy'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedMetric === metric
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {metric.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Coverage Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-text-primary mb-6">Coverage Distribution</h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={coverageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {coverageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {coverageDistribution.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">{item.name}</div>
                  <div className="text-sm text-text-secondary">{item.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* User Portfolio Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Coverages */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary">Your Coverages</h3>
            <Shield className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Active Policies</span>
              <span className="text-text-primary font-semibold">{activeCoveragesCount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Coverage</span>
              <span className="text-text-primary font-semibold">
                {(totalCoverageValue.toNumber() / 1_000_000_000).toFixed(2)} SOL
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Status</span>
              <span className="flex items-center text-green-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </span>
            </div>

            <Link href="/marketplace">
              <GradientButton size="sm" fullWidth className="mt-4">
                Create New Coverage
              </GradientButton>
            </Link>
          </div>
        </GlassCard>

        {/* Your Claims */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary">Your Claims</h3>
            <Activity className="w-6 h-6 text-yellow-500" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Claims</span>
              <span className="text-text-primary font-semibold">{userClaims.length}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Pending</span>
              <span className="text-yellow-500 font-semibold">{pendingClaimsCount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Claimed</span>
              <span className="text-green-500 font-semibold">
                {(totalClaimedAmount.toNumber() / 1_000_000_000).toFixed(4)} SOL
              </span>
            </div>

            <Link href="/claims">
              <GradientButton size="sm" fullWidth className="mt-4" variant="secondary">
                Submit New Claim
              </GradientButton>
            </Link>
          </div>
        </GlassCard>

        {/* Your Liquidity */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary">Your Liquidity</h3>
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>

          <div className="space-y-4">
            {isLiquidityProvider && userLiquidityInfo ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Provided</span>
                  <span className="text-text-primary font-semibold">
                    {(userLiquidityInfo.totalProvided.toNumber() / 1_000_000_000).toFixed(2)} SOL
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">SHIELD Tokens</span>
                  <span className="text-text-primary font-semibold">
                    {(userLiquidityInfo.shieldTokensOwned.toNumber() / 1_000_000_000).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Current APR</span>
                  <span className="text-green-500 font-semibold">
                    {liquidityMetrics?.apr.toFixed(1) || '15.5'}%
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-text-secondary mb-2">No liquidity provided</div>
                <div className="text-sm text-text-secondary">
                  Start earning by providing liquidity
                </div>
              </div>
            )}

            <Link href="/pools">
              <GradientButton size="sm" fullWidth className="mt-4" variant={isLiquidityProvider ? "secondary" : "primary"}>
                {isLiquidityProvider ? 'Manage Liquidity' : 'Add Liquidity'}
              </GradientButton>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Claims Status Chart */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-text-primary mb-6">Claims Processing Overview</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claimsStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="status" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {claimsStatusData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{item.status}</div>
                    <div className="text-lg font-bold text-text-primary">{item.count}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-6">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-text-primary">Processing Time</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {poolMetrics?.averageClaimTime || '2.4h'}
              </div>
              <div className="text-sm text-text-secondary">Average claim processing time</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Protocol Health */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-text-primary mb-6">Protocol Health</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-500">95.2%</div>
            <div className="text-sm text-text-secondary">Claim Success Rate</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {liquidityMetrics?.utilizationRate.toFixed(1) || '75.3'}%
            </div>
            <div className="text-sm text-text-secondary">Pool Utilization</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-bold text-purple-500">AAA</div>
            <div className="text-sm text-text-secondary">Security Rating</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-bold text-yellow-500">99.9%</div>
            <div className="text-sm text-text-secondary">Uptime</div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}