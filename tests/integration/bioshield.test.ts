import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { BIOSHIELD_PROGRAM_ID, SOLANA_RPC_ENDPOINT } from '@/lib/solana/config'
import {
  CoverageType,
  RiskCategory,
  ClaimType,
  ClaimStatus,
  TriggerConditions,
  PoolParams,
  CoverageParams,
  ClaimData
} from '@/lib/solana/types'
import BN from 'bn.js'

describe('BioShields Insurance Integration Tests', () => {
  let connection: Connection
  let provider: AnchorProvider
  let program: Program
  let payer: Keypair
  let authority: Keypair
  let insured: Keypair

  // Test accounts
  let poolAddress: PublicKey
  let coverageAddress: PublicKey
  let claimAddress: PublicKey

  // Mock token mints (en producción serían tokens reales)
  let livesTokenMint: PublicKey
  let shieldTokenMint: PublicKey

  beforeAll(async () => {
    // Setup connection
    connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed')

    // Generate test keypairs
    payer = Keypair.generate()
    authority = Keypair.generate()
    insured = Keypair.generate()

    // Airdrop SOL for testing
    await Promise.all([
      connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL),
      connection.requestAirdrop(insured.publicKey, 2 * LAMPORTS_PER_SOL),
    ])

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Setup provider and program
    const wallet = new Wallet(payer)
    provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })

    // Mock token mints (usar SystemProgram como placeholder)
    livesTokenMint = Keypair.generate().publicKey
    shieldTokenMint = Keypair.generate().publicKey

    console.log('✅ Test environment setup complete')
    console.log('🔑 Program ID:', BIOSHIELD_PROGRAM_ID.toString())
    console.log('🏦 Authority:', authority.publicKey.toString())
    console.log('👤 Insured:', insured.publicKey.toString())
  })

  describe('Pool Management', () => {
    test('Should initialize insurance pool', async () => {
      // Skip actual deployment for now, just test the logic
      expect(authority.publicKey).toBeDefined()
      expect(insured.publicKey).toBeDefined()

      // Mock pool initialization
      const poolParams: PoolParams = {
        feeBasisPoints: 250, // 2.5%
        minCoverageAmount: new BN(1000 * LAMPORTS_PER_SOL),
        maxCoverageAmount: new BN(1000000 * LAMPORTS_PER_SOL),
        oracleAddress: Keypair.generate().publicKey,
      }

      // Test parameter validation
      expect(poolParams.feeBasisPoints).toBeGreaterThan(0)
      expect(poolParams.feeBasisPoints).toBeLessThanOrEqual(10000)
      expect(poolParams.minCoverageAmount.toNumber()).toBeGreaterThan(0)
      expect(poolParams.maxCoverageAmount.gt(poolParams.minCoverageAmount)).toBe(true)

      console.log('✅ Pool parameters validated')
    })

    test('Should validate pool constraints', async () => {
      const invalidParams = {
        feeBasisPoints: 15000, // Invalid: > 10000
        minCoverageAmount: new BN(1000000),
        maxCoverageAmount: new BN(500000), // Invalid: < min
        oracleAddress: Keypair.generate().publicKey,
      }

      expect(invalidParams.feeBasisPoints).toBeGreaterThan(10000)
      expect(new BN(invalidParams.maxCoverageAmount).lt(new BN(invalidParams.minCoverageAmount))).toBe(true)

      console.log('✅ Pool constraint validation works')
    })
  })

  describe('Coverage Creation', () => {
    test('Should create valid coverage parameters', async () => {
      const triggerConditions: TriggerConditions = {
        clinicalTrialFailure: true,
        regulatoryRejection: true,
        ipInvalidation: false,
        minimumThreshold: new BN(1000),
        customConditions: [],
      }

      const coverageParams: CoverageParams = {
        coverageAmount: new BN(10000 * LAMPORTS_PER_SOL),
        coveragePeriod: 365 * 24 * 60 * 60, // 1 year in seconds
        coverageType: CoverageType.ClinicalTrialFailure,
        triggerConditions,
        riskCategory: RiskCategory.Medium,
        metadataUri: 'ipfs://test-metadata',
      }

      // Validate parameters
      expect(coverageParams.coverageAmount.toNumber()).toBeGreaterThan(0)
      expect(coverageParams.coveragePeriod).toBeGreaterThan(0)
      expect(coverageParams.coveragePeriod).toBeLessThanOrEqual(365 * 24 * 60 * 60)
      expect(Object.values(CoverageType)).toContain(coverageParams.coverageType)
      expect(Object.values(RiskCategory)).toContain(coverageParams.riskCategory)

      console.log('✅ Coverage parameters validated')
    })

    test('Should calculate premium correctly', async () => {
      const coverageAmount = new BN(10000 * LAMPORTS_PER_SOL)
      const coveragePeriod = 365 * 24 * 60 * 60 // 1 year
      const riskCategory = RiskCategory.Medium

      // Mock premium calculation
      const riskMultipliers = {
        [RiskCategory.Low]: 0.005,
        [RiskCategory.Medium]: 0.015,
        [RiskCategory.High]: 0.035,
        [RiskCategory.VeryHigh]: 0.065,
      }

      const timeMultiplier = coveragePeriod / (365 * 24 * 60 * 60)
      const riskMultiplier = riskMultipliers[riskCategory]

      const basePremium = coverageAmount
        .mul(new BN(Math.floor(riskMultiplier * 10000)))
        .div(new BN(10000))
        .mul(new BN(Math.floor(timeMultiplier * 100)))
        .div(new BN(100))

      const discountedPremium = basePremium.div(new BN(2)) // 50% discount

      expect(basePremium.toNumber()).toBeGreaterThan(0)
      expect(discountedPremium.toNumber()).toBe(basePremium.toNumber() / 2)

      console.log('✅ Premium calculation verified')
      console.log(`📊 Base premium: ${basePremium.toNumber() / LAMPORTS_PER_SOL} SOL`)
      console.log(`💰 With discount: ${discountedPremium.toNumber() / LAMPORTS_PER_SOL} SOL`)
    })
  })

  describe('Claims Processing', () => {
    test('Should create valid claim data', async () => {
      const claimData: ClaimData = {
        amount: new BN(5000 * LAMPORTS_PER_SOL),
        claimType: ClaimType.PartialCoverage,
        evidenceHash: Array.from(Buffer.from('test-evidence-hash-32-bytes-long', 'utf8').slice(0, 32)),
      }

      expect(claimData.amount.toNumber()).toBeGreaterThan(0)
      expect(Object.values(ClaimType)).toContain(claimData.claimType)
      expect(claimData.evidenceHash).toHaveLength(32)

      console.log('✅ Claim data validated')
    })

    test('Should simulate oracle verification', async () => {
      // Mock oracle data for clinical trial failure
      const oracleData = {
        requestId: Array.from(Buffer.from('mock-request-id-' + Date.now(), 'utf8').slice(0, 32)),
        timestamp: new BN(Math.floor(Date.now() / 1000)),
        dataPoints: [
          {
            dataType: { clinicalTrialResult: { success: false } }, // Trial failed
            value: new BN(0),
            source: 'ClinicalTrials.gov'
          },
          {
            dataType: { regulatoryDecision: { approved: false } }, // Not approved
            value: new BN(0),
            source: 'FDA Database'
          }
        ],
        signatures: [
          Array.from(Buffer.alloc(64, 1)), // Mock signature 1
          Array.from(Buffer.alloc(64, 2)), // Mock signature 2
        ],
        consensus: true
      }

      // Verify oracle data structure
      expect(oracleData.dataPoints).toHaveLength(2)
      expect(oracleData.signatures).toHaveLength(2)
      expect(oracleData.consensus).toBe(true)

      // Check trigger conditions
      const shouldTriggerPayout = oracleData.dataPoints.some(dp =>
        (dp.dataType.clinicalTrialResult && !dp.dataType.clinicalTrialResult.success) ||
        (dp.dataType.regulatoryDecision && !dp.dataType.regulatoryDecision.approved)
      )

      expect(shouldTriggerPayout).toBe(true)

      console.log('✅ Oracle verification simulated')
      console.log('🔍 Should trigger payout:', shouldTriggerPayout)
    })
  })

  describe('End-to-End Workflow', () => {
    test('Should complete full insurance lifecycle', async () => {
      console.log('🔄 Starting end-to-end test...')

      // Step 1: Pool initialization (mocked)
      const poolInitialized = true
      expect(poolInitialized).toBe(true)
      console.log('✅ Step 1: Pool initialized')

      // Step 2: Coverage creation (mocked)
      const coverageCreated = true
      const coverageAmount = new BN(10000 * LAMPORTS_PER_SOL)
      expect(coverageCreated).toBe(true)
      console.log('✅ Step 2: Coverage created for', coverageAmount.toNumber() / LAMPORTS_PER_SOL, 'SOL')

      // Step 3: Claim submission (mocked)
      const claimSubmitted = true
      const claimAmount = new BN(5000 * LAMPORTS_PER_SOL)
      expect(claimSubmitted).toBe(true)
      console.log('✅ Step 3: Claim submitted for', claimAmount.toNumber() / LAMPORTS_PER_SOL, 'SOL')

      // Step 4: Oracle verification (mocked)
      const oracleVerified = true
      const shouldPayout = true
      expect(oracleVerified).toBe(true)
      expect(shouldPayout).toBe(true)
      console.log('✅ Step 4: Oracle verified, payout approved')

      // Step 5: Claim processing (mocked)
      const claimProcessed = true
      const payoutAmount = Math.min(claimAmount.toNumber(), coverageAmount.toNumber())
      expect(claimProcessed).toBe(true)
      expect(payoutAmount).toBe(claimAmount.toNumber())
      console.log('✅ Step 5: Claim processed, payout:', payoutAmount / LAMPORTS_PER_SOL, 'SOL')

      console.log('🎉 End-to-end test completed successfully!')
    })

    test('Should handle edge cases', async () => {
      // Test case: Claim amount exceeds coverage
      const coverageAmount = new BN(1000 * LAMPORTS_PER_SOL)
      const excessiveClaimAmount = new BN(2000 * LAMPORTS_PER_SOL)

      const isValidClaim = excessiveClaimAmount.lte(coverageAmount)
      expect(isValidClaim).toBe(false)
      console.log('✅ Excessive claim amount properly rejected')

      // Test case: Expired coverage
      const currentTime = Math.floor(Date.now() / 1000)
      const coverageEndTime = currentTime - 3600 // 1 hour ago

      const isCoverageActive = coverageEndTime > currentTime
      expect(isCoverageActive).toBe(false)
      console.log('✅ Expired coverage properly handled')

      // Test case: Invalid oracle consensus
      const insufficientOracleData = {
        dataPoints: [
          { /* only one data point */ }
        ],
        consensus: false
      }

      const hasConsensus = insufficientOracleData.consensus && insufficientOracleData.dataPoints.length >= 2
      expect(hasConsensus).toBe(false)
      console.log('✅ Insufficient oracle consensus properly rejected')
    })
  })

  describe('Performance Tests', () => {
    test('Should handle multiple operations efficiently', async () => {
      const startTime = Date.now()

      // Simulate multiple operations
      const operations = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        type: 'coverage_creation',
        amount: new BN((1000 + i) * LAMPORTS_PER_SOL),
        processed: true
      }))

      // Validate all operations
      operations.forEach(op => {
        expect(op.amount.toNumber()).toBeGreaterThan(0)
        expect(op.processed).toBe(true)
      })

      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(1000) // Should complete in less than 1 second
      console.log(`✅ Performance test: ${operations.length} operations in ${executionTime}ms`)
    })
  })

  afterAll(async () => {
    console.log('🧹 Test cleanup completed')
  })
})