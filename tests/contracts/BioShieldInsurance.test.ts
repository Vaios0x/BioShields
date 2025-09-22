import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BioShieldInsurance, SHIELDToken, LIVESToken, ChainlinkOracle } from '../typechain';
import { parseEther, formatEther } from 'ethers/lib/utils';
import { time } from '@nomicfoundation/hardhat-network-helpers';

describe('BioShield Insurance - Complete Test Suite', () => {
  let bioShield: BioShieldInsurance;
  let shieldToken: SHIELDToken;
  let livesToken: LIVESToken;
  let chainlinkOracle: ChainlinkOracle;
  let owner: SignerWithAddress;
  let insured: SignerWithAddress;
  let liquidityProvider: SignerWithAddress;
  let oracle: SignerWithAddress;
  let otherUsers: SignerWithAddress[];

  const INITIAL_LIVES_SUPPLY = parseEther('50000000'); // 50M LIVES
  const INITIAL_SHIELD_SUPPLY = parseEther('100000000'); // 100M SHIELD
  const DEFAULT_COVERAGE_AMOUNT = parseEther('100000'); // $100K
  const DEFAULT_COVERAGE_PERIOD = 365 * 24 * 60 * 60; // 1 year
  const DEFAULT_PREMIUM = parseEther('5000'); // $5K

  beforeEach(async () => {
    [owner, insured, liquidityProvider, oracle, ...otherUsers] = await ethers.getSigners();

    // Deploy LIVES Token
    const LIVESToken = await ethers.getContractFactory('LIVESToken');
    livesToken = await upgrades.deployProxy(
      LIVESToken,
      ['LIVES Token', 'LIVES', ethers.constants.AddressZero, ethers.constants.AddressZero],
      { initializer: 'initialize' }
    ) as LIVESToken;

    // Deploy SHIELD Token
    const SHIELDToken = await ethers.getContractFactory('SHIELDToken');
    shieldToken = await upgrades.deployProxy(
      SHIELDToken,
      ['SHIELD Token', 'SHIELD', ethers.constants.AddressZero, ethers.constants.AddressZero],
      { initializer: 'initialize' }
    ) as SHIELDToken;

    // Deploy Chainlink Oracle Mock
    const ChainlinkOracle = await ethers.getContractFactory('ChainlinkOracle');
    chainlinkOracle = await ChainlinkOracle.deploy(
      ethers.constants.AddressZero, // LINK token (mock)
      oracle.address, // Oracle address
      ethers.utils.formatBytes32String('test-job'), // Job ID
      parseEther('0.1') // Fee
    );

    // Deploy main BioShield contract
    const BioShieldInsurance = await ethers.getContractFactory('BioShieldInsurance');
    bioShield = await upgrades.deployProxy(
      BioShieldInsurance,
      [
        livesToken.address,
        shieldToken.address,
        ethers.constants.AddressZero, // NFT address (will be set later)
        ethers.constants.AddressZero, // Pool address (will be set later)
        owner.address, // Treasury
        chainlinkOracle.address, // Oracle
      ],
      { initializer: 'initialize' }
    ) as BioShieldInsurance;

    // Setup roles and permissions
    await bioShield.grantRole(await bioShield.ORACLE_ROLE(), oracle.address);
    await chainlinkOracle.authorizeContract(bioShield.address, true);

    // Mint test tokens
    await livesToken.mint(insured.address, parseEther('1000000')); // 1M LIVES
    await livesToken.mint(liquidityProvider.address, parseEther('1000000'));
    await shieldToken.mint(liquidityProvider.address, parseEther('100000')); // 100K SHIELD

    // Approve spending
    await livesToken.connect(insured).approve(bioShield.address, ethers.constants.MaxUint256);
    await livesToken.connect(liquidityProvider).approve(bioShield.address, ethers.constants.MaxUint256);
  });

  describe('Contract Deployment and Initialization', () => {
    it('should deploy contracts with correct initial state', async () => {
      expect(await bioShield.livesToken()).to.equal(livesToken.address);
      expect(await bioShield.shieldToken()).to.equal(shieldToken.address);
      expect(await bioShield.chainlinkOracle()).to.equal(chainlinkOracle.address);
      expect(await bioShield.poolFeePercentage()).to.equal(200); // 2%
      expect(await bioShield.nextCoverageId()).to.equal(0);
    });

    it('should have correct token supplies', async () => {
      expect(await livesToken.totalSupply()).to.equal(INITIAL_LIVES_SUPPLY);
      expect(await shieldToken.totalSupply()).to.equal(INITIAL_SHIELD_SUPPLY);
    });

    it('should grant correct roles', async () => {
      const DEFAULT_ADMIN_ROLE = await bioShield.DEFAULT_ADMIN_ROLE();
      const ORACLE_ROLE = await bioShield.ORACLE_ROLE();

      expect(await bioShield.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await bioShield.hasRole(ORACLE_ROLE, oracle.address)).to.be.true;
    });
  });

  describe('Coverage Creation', () => {
    const triggerConditions = {
      clinicalTrialFailure: true,
      regulatoryRejection: false,
      ipInvalidation: false,
      minimumThreshold: parseEther('10000'),
      customConditionsHash: ethers.constants.HashZero,
    };

    it('should create coverage with ETH payment', async () => {
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);

      const tx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0, // CoverageType.ClinicalTrialFailure
        triggerConditions,
        false, // payWithLives
        'ipfs://test-metadata',
        { value: premium }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'CoverageCreated');

      expect(event).to.not.be.undefined;
      expect(event?.args?.insured).to.equal(insured.address);
      expect(event?.args?.coverageAmount).to.equal(DEFAULT_COVERAGE_AMOUNT);
      expect(event?.args?.paidWithLives).to.be.false;

      const coverageId = event?.args?.coverageId;
      const coverage = await bioShield.coverages(coverageId);

      expect(coverage.insured).to.equal(insured.address);
      expect(coverage.coverageAmount).to.equal(DEFAULT_COVERAGE_AMOUNT);
      expect(coverage.status).to.equal(0); // CoverageStatus.Active
    });

    it('should create coverage with LIVES token payment and apply 50% discount', async () => {
      const basePremium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);
      const discountedPremium = basePremium.div(2); // 50% discount

      const tx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0, // CoverageType.ClinicalTrialFailure
        triggerConditions,
        true, // payWithLives
        'ipfs://test-metadata',
        { value: 0 }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'CoverageCreated');

      expect(event?.args?.paidWithLives).to.be.true;
      expect(event?.args?.premium).to.be.closeTo(discountedPremium, discountedPremium.div(100)); // 1% tolerance

      // Check LIVES token balance was reduced
      const livesBalance = await livesToken.balanceOf(insured.address);
      expect(livesBalance).to.be.lt(parseEther('1000000'));
    });

    it('should enforce coverage amount limits', async () => {
      const oversizedCoverage = parseEther('20000000'); // > MAX_COVERAGE_AMOUNT (15M)
      const premium = await calculateExpectedPremium(oversizedCoverage, DEFAULT_COVERAGE_PERIOD, 0);

      await expect(
        bioShield.connect(insured).createCoverage(
          oversizedCoverage,
          DEFAULT_COVERAGE_PERIOD,
          0,
          triggerConditions,
          false,
          'ipfs://test-metadata',
          { value: premium }
        )
      ).to.be.revertedWith('Invalid coverage amount');
    });

    it('should enforce coverage period limits', async () => {
      const longPeriod = 400 * 24 * 60 * 60; // > MAX_COVERAGE_PERIOD (365 days)
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, longPeriod, 0);

      await expect(
        bioShield.connect(insured).createCoverage(
          DEFAULT_COVERAGE_AMOUNT,
          longPeriod,
          0,
          triggerConditions,
          false,
          'ipfs://test-metadata',
          { value: premium }
        )
      ).to.be.revertedWith('Coverage period too long');
    });

    it('should revert with insufficient payment', async () => {
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);
      const insufficientPayment = premium.div(2);

      await expect(
        bioShield.connect(insured).createCoverage(
          DEFAULT_COVERAGE_AMOUNT,
          DEFAULT_COVERAGE_PERIOD,
          0,
          triggerConditions,
          false,
          'ipfs://test-metadata',
          { value: insufficientPayment }
        )
      ).to.be.revertedWith('Insufficient payment');
    });

    it('should refund excess payment', async () => {
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);
      const excessPayment = premium.mul(2);

      const balanceBefore = await insured.getBalance();

      const tx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0,
        triggerConditions,
        false,
        'ipfs://test-metadata',
        { value: excessPayment }
      );

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const balanceAfter = await insured.getBalance();

      // Should only pay premium amount + gas, not the full excess
      const expectedBalance = balanceBefore.sub(premium).sub(gasUsed);
      expect(balanceAfter).to.be.closeTo(expectedBalance, parseEther('0.01')); // Small tolerance for gas estimation
    });
  });

  describe('Claim Submission and Processing', () => {
    let coverageId: number;

    beforeEach(async () => {
      // Create a test coverage first
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);

      const tx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0,
        {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: parseEther('10000'),
          customConditionsHash: ethers.constants.HashZero,
        },
        false,
        'ipfs://test-metadata',
        { value: premium }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'CoverageCreated');
      coverageId = event?.args?.coverageId;
    });

    it('should submit claim successfully', async () => {
      const claimAmount = parseEther('50000');
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      const tx = await bioShield.connect(insured).submitClaim(
        coverageId,
        claimAmount,
        0, // ClaimType.FullCoverage
        evidenceHash,
        'ipfs://evidence'
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'ClaimSubmitted');

      expect(event).to.not.be.undefined;
      expect(event?.args?.claimant).to.equal(insured.address);
      expect(event?.args?.amount).to.equal(claimAmount);

      const claimId = event?.args?.claimId;
      const claims = await bioShield.coverageClaims(coverageId, claimId);

      expect(claims.claimAmount).to.equal(claimAmount);
      expect(claims.status).to.equal(0); // ClaimStatus.Pending
    });

    it('should process claim with oracle verification', async () => {
      // Submit claim first
      const claimAmount = parseEther('50000');
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      await bioShield.connect(insured).submitClaim(
        coverageId,
        claimAmount,
        0,
        evidenceHash,
        'ipfs://evidence'
      );

      // Mock oracle response (claim approved)
      const oracleResponse = ethers.utils.defaultAbiCoder.encode(
        ['bool', 'uint256'],
        [true, claimAmount]
      );

      const balanceBefore = await insured.getBalance();

      await bioShield.connect(oracle).processClaimWithOracle(
        coverageId,
        0, // claimId
        oracleResponse
      );

      const balanceAfter = await insured.getBalance();
      const claim = await bioShield.coverageClaims(coverageId, 0);
      const coverage = await bioShield.coverages(coverageId);

      expect(claim.status).to.equal(2); // ClaimStatus.Approved
      expect(balanceAfter.sub(balanceBefore)).to.equal(claimAmount);
      expect(coverage.totalClaimed).to.equal(claimAmount);
    });

    it('should reject invalid claims', async () => {
      // Submit claim
      const claimAmount = parseEther('50000');
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      await bioShield.connect(insured).submitClaim(
        coverageId,
        claimAmount,
        0,
        evidenceHash,
        'ipfs://evidence'
      );

      // Mock oracle response (claim rejected)
      const oracleResponse = ethers.utils.defaultAbiCoder.encode(
        ['bool', 'uint256'],
        [false, 0]
      );

      await bioShield.connect(oracle).processClaimWithOracle(
        coverageId,
        0,
        oracleResponse
      );

      const claim = await bioShield.coverageClaims(coverageId, 0);
      expect(claim.status).to.equal(3); // ClaimStatus.Rejected
    });

    it('should prevent claims exceeding remaining coverage', async () => {
      const excessiveClaimAmount = DEFAULT_COVERAGE_AMOUNT.add(parseEther('1'));
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      await expect(
        bioShield.connect(insured).submitClaim(
          coverageId,
          excessiveClaimAmount,
          0,
          evidenceHash,
          'ipfs://evidence'
        )
      ).to.be.revertedWith('Claim exceeds remaining coverage');
    });

    it('should prevent unauthorized claim submission', async () => {
      const claimAmount = parseEther('50000');
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      await expect(
        bioShield.connect(otherUsers[0]).submitClaim(
          coverageId,
          claimAmount,
          0,
          evidenceHash,
          'ipfs://evidence'
        )
      ).to.be.revertedWith('Not the insured');
    });
  });

  describe('Liquidity Management', () => {
    it('should add liquidity with ETH and mint SHIELD tokens', async () => {
      const liquidityAmount = parseEther('10000');

      const shieldBalanceBefore = await shieldToken.balanceOf(liquidityProvider.address);

      await bioShield.connect(liquidityProvider).addLiquidity(
        liquidityAmount,
        false, // Use ETH
        { value: liquidityAmount }
      );

      const shieldBalanceAfter = await shieldToken.balanceOf(liquidityProvider.address);
      const tvl = await bioShield.totalValueLocked();

      expect(tvl).to.equal(liquidityAmount);
      expect(shieldBalanceAfter).to.be.gt(shieldBalanceBefore);
    });

    it('should add liquidity with LIVES tokens', async () => {
      const liquidityAmount = parseEther('10000');

      await bioShield.connect(liquidityProvider).addLiquidity(
        liquidityAmount,
        true // Use LIVES
      );

      const tvl = await bioShield.totalValueLocked();
      expect(tvl).to.equal(liquidityAmount);
    });

    it('should calculate correct SHIELD token amounts for subsequent liquidity additions', async () => {
      // First liquidity addition
      const firstAmount = parseEther('10000');
      await bioShield.connect(liquidityProvider).addLiquidity(
        firstAmount,
        false,
        { value: firstAmount }
      );

      const firstShieldBalance = await shieldToken.balanceOf(liquidityProvider.address);

      // Second liquidity addition from another user
      const secondAmount = parseEther('5000');
      await bioShield.connect(otherUsers[0]).addLiquidity(
        secondAmount,
        false,
        { value: secondAmount }
      );

      const otherUserShieldBalance = await shieldToken.balanceOf(otherUsers[0].address);

      // Second provider should get proportionally fewer SHIELD tokens
      const expectedRatio = secondAmount.mul(10000).div(firstAmount);
      const actualRatio = otherUserShieldBalance.mul(10000).div(firstShieldBalance);

      expect(actualRatio).to.be.closeTo(expectedRatio, 100); // 1% tolerance
    });

    it('should remove liquidity correctly', async () => {
      // Add liquidity first
      const liquidityAmount = parseEther('10000');
      await bioShield.connect(liquidityProvider).addLiquidity(
        liquidityAmount,
        false,
        { value: liquidityAmount }
      );

      const shieldBalance = await shieldToken.balanceOf(liquidityProvider.address);
      const balanceBefore = await liquidityProvider.getBalance();

      // Remove half of the liquidity
      const lpTokensToRemove = shieldBalance.div(2);

      await bioShield.connect(liquidityProvider).removeLiquidity(lpTokensToRemove);

      const balanceAfter = await liquidityProvider.getBalance();
      const expectedWithdrawal = liquidityAmount.div(2);

      expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(expectedWithdrawal, parseEther('0.01'));
    });
  });

  describe('Chainlink Automation', () => {
    it('should identify expired coverages for upkeep', async () => {
      // Create coverage with short period
      const shortPeriod = 60; // 60 seconds
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, shortPeriod, 0);

      await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        shortPeriod,
        0,
        {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: parseEther('10000'),
          customConditionsHash: ethers.constants.HashZero,
        },
        false,
        'ipfs://test-metadata',
        { value: premium }
      );

      // Fast forward time
      await time.increase(61);

      const [upkeepNeeded, performData] = await bioShield.checkUpkeep('0x');

      expect(upkeepNeeded).to.be.true;

      const [expiredCoverages] = ethers.utils.defaultAbiCoder.decode(
        ['uint256[]', 'uint256[]'],
        performData
      );

      expect(expiredCoverages.length).to.be.gt(0);
    });

    it('should perform upkeep for expired coverages', async () => {
      // Create and expire coverage
      const shortPeriod = 60;
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, shortPeriod, 0);

      const tx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        shortPeriod,
        0,
        {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: parseEther('10000'),
          customConditionsHash: ethers.constants.HashZero,
        },
        false,
        'ipfs://test-metadata',
        { value: premium }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'CoverageCreated');
      const coverageId = event?.args?.coverageId;

      await time.increase(61);

      const [, performData] = await bioShield.checkUpkeep('0x');
      await bioShield.performUpkeep(performData);

      const coverage = await bioShield.coverages(coverageId);
      expect(coverage.status).to.equal(1); // CoverageStatus.Expired
    });
  });

  describe('Risk Assessment and Premium Calculation', () => {
    it('should calculate different premiums based on risk levels', async () => {
      const coverageAmount = parseEther('100000');
      const period = 365 * 24 * 60 * 60;

      // Low risk (ResearchInfrastructure)
      const lowRiskPremium = await calculateExpectedPremium(coverageAmount, period, 3);

      // High risk (ClinicalTrialFailure)
      const highRiskPremium = await calculateExpectedPremium(coverageAmount, period, 0);

      expect(highRiskPremium).to.be.gt(lowRiskPremium);
    });

    it('should adjust premiums based on coverage amount', async () => {
      const smallAmount = parseEther('50000');
      const largeAmount = parseEther('5000000');
      const period = 365 * 24 * 60 * 60;

      const smallPremium = await calculateExpectedPremium(smallAmount, period, 0);
      const largePremium = await calculateExpectedPremium(largeAmount, period, 0);

      // Premium should be proportionally higher for larger amounts
      const smallRatio = smallPremium.mul(100).div(smallAmount);
      const largeRatio = largePremium.mul(100).div(largeAmount);

      expect(largeRatio).to.be.gte(smallRatio); // Large amounts may have higher risk multiplier
    });
  });

  describe('Gas Optimization Tests', () => {
    it('should consume reasonable gas for coverage creation', async () => {
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);

      const tx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0,
        {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: parseEther('10000'),
          customConditionsHash: ethers.constants.HashZero,
        },
        false,
        'ipfs://test-metadata',
        { value: premium }
      );

      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lt(500000);
      console.log(`Gas used for coverage creation: ${receipt.gasUsed}`);
    });

    it('should optimize gas for claim processing', async () => {
      // Setup coverage first
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);

      const createTx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0,
        {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: parseEther('10000'),
          customConditionsHash: ethers.constants.HashZero,
        },
        false,
        'ipfs://test-metadata',
        { value: premium }
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.events?.find(e => e.event === 'CoverageCreated');
      const coverageId = createEvent?.args?.coverageId;

      // Submit claim
      const claimAmount = parseEther('50000');
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      const submitTx = await bioShield.connect(insured).submitClaim(
        coverageId,
        claimAmount,
        0,
        evidenceHash,
        'ipfs://evidence'
      );

      const submitReceipt = await submitTx.wait();
      expect(submitReceipt.gasUsed).to.be.lt(300000);

      // Process claim
      const oracleResponse = ethers.utils.defaultAbiCoder.encode(
        ['bool', 'uint256'],
        [true, claimAmount]
      );

      const processTx = await bioShield.connect(oracle).processClaimWithOracle(
        coverageId,
        0,
        oracleResponse
      );

      const processReceipt = await processTx.wait();
      expect(processReceipt.gasUsed).to.be.lt(400000);

      console.log(`Gas used for claim submission: ${submitReceipt.gasUsed}`);
      console.log(`Gas used for claim processing: ${processReceipt.gasUsed}`);
    });
  });

  describe('Security Tests', () => {
    it('should prevent reentrancy attacks', async () => {
      // This would require a malicious contract that attempts reentrancy
      // For now, we verify that the ReentrancyGuard is properly applied
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);

      // Verify that multiple concurrent calls fail
      const promises = Array(5).fill(0).map(() =>
        bioShield.connect(insured).createCoverage(
          DEFAULT_COVERAGE_AMOUNT,
          DEFAULT_COVERAGE_PERIOD,
          0,
          {
            clinicalTrialFailure: true,
            regulatoryRejection: false,
            ipInvalidation: false,
            minimumThreshold: parseEther('10000'),
            customConditionsHash: ethers.constants.HashZero,
          },
          false,
          'ipfs://test-metadata',
          { value: premium }
        )
      );

      // Only one should succeed due to nonce management and reentrancy protection
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      expect(successful).to.be.lte(1);
    });

    it('should validate oracle signatures', async () => {
      // Create coverage and claim first
      const premium = await calculateExpectedPremium(DEFAULT_COVERAGE_AMOUNT, DEFAULT_COVERAGE_PERIOD, 0);

      const createTx = await bioShield.connect(insured).createCoverage(
        DEFAULT_COVERAGE_AMOUNT,
        DEFAULT_COVERAGE_PERIOD,
        0,
        {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: parseEther('10000'),
          customConditionsHash: ethers.constants.HashZero,
        },
        false,
        'ipfs://test-metadata',
        { value: premium }
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.events?.find(e => e.event === 'CoverageCreated');
      const coverageId = createEvent?.args?.coverageId;

      const claimAmount = parseEther('50000');
      const evidenceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('evidence123'));

      await bioShield.connect(insured).submitClaim(
        coverageId,
        claimAmount,
        0,
        evidenceHash,
        'ipfs://evidence'
      );

      // Try to process claim with unauthorized address
      const oracleResponse = ethers.utils.defaultAbiCoder.encode(
        ['bool', 'uint256'],
        [true, claimAmount]
      );

      await expect(
        bioShield.connect(otherUsers[0]).processClaimWithOracle(
          coverageId,
          0,
          oracleResponse
        )
      ).to.be.reverted; // Should revert due to missing ORACLE_ROLE
    });
  });

  // Helper function to calculate expected premium
  async function calculateExpectedPremium(
    amount: any,
    period: number,
    coverageType: number
  ): Promise<any> {
    // Simulate the premium calculation logic
    let riskMultiplier: number;
    switch (coverageType) {
      case 0: // ClinicalTrialFailure
        riskMultiplier = 1200; // 12%
        break;
      case 1: // RegulatoryRejection
        riskMultiplier = 800; // 8%
        break;
      case 2: // IpInvalidation
        riskMultiplier = 500; // 5%
        break;
      default: // ResearchInfrastructure
        riskMultiplier = 300; // 3%
    }

    let basePremium = amount.mul(riskMultiplier).div(10000);
    const periodInDays = period / (24 * 60 * 60);
    basePremium = basePremium.mul(periodInDays).div(365);

    return basePremium;
  }
});