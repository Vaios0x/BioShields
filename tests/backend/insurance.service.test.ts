import { Test, TestingModule } from '@nestjs/testing';
import { InsuranceService } from '../../backend/src/modules/insurance/insurance.service';
import { PrismaService } from '../../backend/src/common/services/prisma.service';
import { BlockchainService } from '../../backend/src/modules/blockchain/blockchain.service';
import { OracleService } from '../../backend/src/modules/oracle/oracle.service';
import { IpfsService } from '../../backend/src/modules/ipfs/ipfs.service';
import { CacheService } from '../../backend/src/modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BigNumber } from 'ethers';

describe('InsuranceService', () => {
  let service: InsuranceService;
  let prismaService: jest.Mocked<PrismaService>;
  let blockchainService: jest.Mocked<BlockchainService>;
  let oracleService: jest.Mocked<OracleService>;
  let ipfsService: jest.Mocked<IpfsService>;
  let cacheService: jest.Mocked<CacheService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser = {
    id: 'user-123',
    walletAddress: '0x1234567890123456789012345678901234567890',
    email: 'test@example.com',
    tier: 'BASIC',
  };

  const mockCoverage = {
    id: 'coverage-123',
    userId: 'user-123',
    coverageAmount: '100000',
    premium: '5000',
    coverageType: 'CLINICAL_TRIAL_FAILURE',
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    riskScore: 70,
    transactionHash: '0xabcdef',
    blockchainId: 'blockchain-123',
    chain: 'solana',
    paidWithLives: false,
    totalClaimed: '0',
    triggerConditions: {
      clinicalTrialFailure: true,
      regulatoryRejection: false,
      ipInvalidation: false,
      minimumThreshold: 10000,
    },
  };

  const mockClaim = {
    id: 'claim-123',
    coverageId: 'coverage-123',
    userId: 'user-123',
    claimAmount: '50000',
    claimType: 'FULL_COVERAGE',
    evidenceHash: 'ipfs-hash-123',
    status: 'PENDING',
    submittedAt: new Date(),
    urgent: false,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      coverage: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      claim: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const mockBlockchainService = {
      getAggregatedPoolData: jest.fn(),
      processPayout: jest.fn(),
    };

    const mockOracleService = {
      requestVerification: jest.fn(),
      getVerificationStatus: jest.fn(),
    };

    const mockIpfsService = {
      uploadFile: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsuranceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BlockchainService, useValue: mockBlockchainService },
        { provide: OracleService, useValue: mockOracleService },
        { provide: IpfsService, useValue: mockIpfsService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<InsuranceService>(InsuranceService);
    prismaService = module.get(PrismaService);
    blockchainService = module.get(BlockchainService);
    oracleService = module.get(OracleService);
    ipfsService = module.get(IpfsService);
    cacheService = module.get(CacheService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('calculatePremium', () => {
    it('should calculate premium correctly for different risk profiles', async () => {
      const params = {
        coverageAmount: '100000',
        coveragePeriod: 365 * 24 * 60 * 60, // 1 year
        coverageType: 'CLINICAL_TRIAL_FAILURE',
        riskProfile: { score: 70 },
        payWithLives: false,
        userTier: 'BASIC',
      };

      // Mock market conditions and pool utilization
      cacheService.get
        .mockResolvedValueOnce(null) // Market conditions cache miss
        .mockResolvedValueOnce(null); // Pool utilization cache miss

      blockchainService.getAggregatedPoolData.mockResolvedValue({
        totalLiquidity: 1000000,
        totalCoverage: 400000,
      });

      const result = await service.calculatePremium(params);

      expect(result).toHaveProperty('basePremium');
      expect(result).toHaveProperty('finalPremium');
      expect(result).toHaveProperty('riskMultiplier');
      expect(result.riskMultiplier).toBe(800); // High risk (score 70)
      expect(result.livesDiscount).toBe(0); // No LIVES discount
    });

    it('should apply 50% discount for LIVES payment', async () => {
      const params = {
        coverageAmount: '100000',
        coveragePeriod: 365 * 24 * 60 * 60,
        coverageType: 'CLINICAL_TRIAL_FAILURE',
        riskProfile: { score: 70 },
        payWithLives: true,
        userTier: 'BASIC',
      };

      cacheService.get.mockResolvedValue(null);
      blockchainService.getAggregatedPoolData.mockResolvedValue({
        totalLiquidity: 1000000,
        totalCoverage: 400000,
      });

      const result = await service.calculatePremium(params);

      expect(result.livesDiscount).toBe(50);
      expect(BigNumber.from(result.finalPremium)).to.be.lt(
        BigNumber.from(result.basePremium)
      );
    });

    it('should apply tier discounts correctly', async () => {
      const premiumParams = {
        coverageAmount: '100000',
        coveragePeriod: 365 * 24 * 60 * 60,
        coverageType: 'CLINICAL_TRIAL_FAILURE',
        riskProfile: { score: 70 },
        payWithLives: false,
        userTier: 'PREMIUM',
      };

      cacheService.get.mockResolvedValue(null);
      blockchainService.getAggregatedPoolData.mockResolvedValue({
        totalLiquidity: 1000000,
        totalCoverage: 400000,
      });

      const result = await service.calculatePremium(premiumParams);

      expect(result.tierDiscount).toBe(15); // PREMIUM tier gets 15% discount
    });
  });

  describe('createCoverage', () => {
    it('should create coverage successfully', async () => {
      const coverageData = {
        userId: mockUser.id,
        coverageAmount: '100000',
        coveragePeriod: 365 * 24 * 60 * 60,
        coverageType: 'CLINICAL_TRIAL_FAILURE',
        triggerConditions: mockCoverage.triggerConditions,
        premium: '5000',
        riskScore: 70,
        transactionHash: '0xabcdef',
        blockchainId: 'blockchain-123',
        chain: 'solana',
        payWithLives: false,
      };

      prismaService.coverage.create.mockResolvedValue({
        ...mockCoverage,
        user: mockUser,
      });

      const result = await service.createCoverage(coverageData);

      expect(prismaService.coverage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: coverageData.userId,
          coverageAmount: coverageData.coverageAmount,
          premium: coverageData.premium,
          status: 'ACTIVE',
        }),
        include: {
          user: {
            select: { id: true, walletAddress: true, email: true },
          },
        },
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('coverage.created', {
        coverageId: mockCoverage.id,
        userId: coverageData.userId,
        amount: coverageData.coverageAmount,
        type: coverageData.coverageType,
        chain: coverageData.chain,
      });

      expect(cacheService.del).toHaveBeenCalledWith(`user:${coverageData.userId}:coverages`);
      expect(result).toEqual(expect.objectContaining(mockCoverage));
    });

    it('should handle database errors gracefully', async () => {
      const coverageData = {
        userId: mockUser.id,
        coverageAmount: '100000',
        coveragePeriod: 365 * 24 * 60 * 60,
        coverageType: 'CLINICAL_TRIAL_FAILURE',
        triggerConditions: mockCoverage.triggerConditions,
        premium: '5000',
        riskScore: 70,
        transactionHash: '0xabcdef',
        blockchainId: 'blockchain-123',
        chain: 'solana',
        payWithLives: false,
      };

      prismaService.coverage.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createCoverage(coverageData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createClaim', () => {
    beforeEach(() => {
      prismaService.coverage.findFirst.mockResolvedValue(mockCoverage);
      prismaService.claim.aggregate.mockResolvedValue({
        _sum: { claimAmount: '0' },
      });
    });

    it('should create claim successfully', async () => {
      const claimData = {
        userId: mockUser.id,
        coverageId: mockCoverage.id,
        claimAmount: '50000',
        claimType: 'FULL_COVERAGE',
        evidenceHash: 'ipfs-hash-123',
        transactionHash: '0xabcdef',
        status: 'PENDING',
      };

      prismaService.claim.create.mockResolvedValue({
        ...mockClaim,
        coverage: {
          id: mockCoverage.id,
          coverageType: mockCoverage.coverageType,
          triggerConditions: mockCoverage.triggerConditions,
        },
      });

      const result = await service.createClaim(claimData);

      expect(prismaService.claim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          coverageId: claimData.coverageId,
          userId: claimData.userId,
          claimAmount: claimData.claimAmount,
          status: claimData.status,
        }),
        include: {
          coverage: {
            select: { id: true, coverageType: true, triggerConditions: true },
          },
        },
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('claim.submitted', {
        claimId: result.id,
        coverageId: claimData.coverageId,
        userId: claimData.userId,
        amount: claimData.claimAmount,
        urgent: undefined,
      });

      expect(result).toEqual(expect.objectContaining(mockClaim));
    });

    it('should prevent claims exceeding remaining coverage', async () => {
      const claimData = {
        userId: mockUser.id,
        coverageId: mockCoverage.id,
        claimAmount: '150000', // Exceeds coverage amount
        claimType: 'FULL_COVERAGE',
        evidenceHash: 'ipfs-hash-123',
        transactionHash: '0xabcdef',
        status: 'PENDING',
      };

      await expect(service.createClaim(claimData)).rejects.toThrow(
        'Claim amount exceeds remaining coverage'
      );
    });

    it('should reject claims for inactive coverage', async () => {
      prismaService.coverage.findFirst.mockResolvedValue(null);

      const claimData = {
        userId: mockUser.id,
        coverageId: 'invalid-coverage-id',
        claimAmount: '50000',
        claimType: 'FULL_COVERAGE',
        evidenceHash: 'ipfs-hash-123',
        transactionHash: '0xabcdef',
        status: 'PENDING',
      };

      await expect(service.createClaim(claimData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('processClaimPayout', () => {
    beforeEach(() => {
      prismaService.claim.findUnique.mockResolvedValue({
        ...mockClaim,
        coverage: mockCoverage,
        user: mockUser,
      });
    });

    it('should process approved claim payout', async () => {
      const txResult = {
        transactionHash: '0xpayout123',
        blockNumber: 12345,
      };

      blockchainService.processPayout.mockResolvedValue(txResult);
      prismaService.claim.update.mockResolvedValue({
        ...mockClaim,
        status: 'APPROVED',
        processedAt: new Date(),
        payoutTransactionHash: txResult.transactionHash,
      });

      const result = await service.processClaimPayout(mockClaim.id, true);

      expect(blockchainService.processPayout).toHaveBeenCalledWith({
        claimId: mockClaim.id,
        amount: mockClaim.claimAmount,
        recipient: mockUser.walletAddress,
        payInLives: mockCoverage.paidWithLives,
        chain: mockCoverage.chain,
      });

      expect(prismaService.claim.update).toHaveBeenCalledWith({
        where: { id: mockClaim.id },
        data: expect.objectContaining({
          status: 'APPROVED',
          payoutTransactionHash: txResult.transactionHash,
        }),
      });

      expect(prismaService.coverage.update).toHaveBeenCalledWith({
        where: { id: mockClaim.coverageId },
        data: {
          totalClaimed: {
            increment: Number(mockClaim.claimAmount),
          },
        },
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('claim.approved', {
        claimId: mockClaim.id,
        amount: mockClaim.claimAmount,
        transactionHash: txResult.transactionHash,
      });

      expect(result.status).toBe('APPROVED');
    });

    it('should process rejected claim', async () => {
      const rejectionReason = 'Failed oracle verification';

      prismaService.claim.update.mockResolvedValue({
        ...mockClaim,
        status: 'REJECTED',
        processedAt: new Date(),
        rejectionReason,
      });

      const result = await service.processClaimPayout(mockClaim.id, false, rejectionReason);

      expect(prismaService.claim.update).toHaveBeenCalledWith({
        where: { id: mockClaim.id },
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionReason,
        }),
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith('claim.rejected', {
        claimId: mockClaim.id,
        reason: rejectionReason,
      });

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('uploadEvidenceToIPFS', () => {
    it('should upload evidence successfully', async () => {
      const mockEvidence = { file: 'test-evidence.pdf', data: 'base64data' };
      const mockIpfsHash = 'QmTestHash123';

      ipfsService.uploadFile.mockResolvedValue(mockIpfsHash);

      const result = await service.uploadEvidenceToIPFS(mockEvidence);

      expect(ipfsService.uploadFile).toHaveBeenCalledWith(mockEvidence);
      expect(result).toBe(mockIpfsHash);
    });

    it('should handle IPFS upload failures', async () => {
      const mockEvidence = { file: 'test-evidence.pdf', data: 'base64data' };

      ipfsService.uploadFile.mockRejectedValue(new Error('IPFS error'));

      await expect(service.uploadEvidenceToIPFS(mockEvidence)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('requestOracleVerification', () => {
    it('should request oracle verification successfully', async () => {
      const verificationParams = {
        claimId: mockClaim.id,
        evidenceHash: 'ipfs-hash-123',
        triggerConditions: mockCoverage.triggerConditions,
        urgency: false,
      };

      const mockVerificationRequest = {
        requestId: 'oracle-request-123',
        status: 'PENDING',
      };

      oracleService.requestVerification.mockResolvedValue(mockVerificationRequest);
      prismaService.claim.update.mockResolvedValue({
        ...mockClaim,
        oracleRequestId: mockVerificationRequest.requestId,
        status: 'UNDER_REVIEW',
      });

      const result = await service.requestOracleVerification(verificationParams);

      expect(oracleService.requestVerification).toHaveBeenCalledWith({
        claimId: verificationParams.claimId,
        evidenceHash: verificationParams.evidenceHash,
        triggerConditions: verificationParams.triggerConditions,
        urgent: verificationParams.urgency,
      });

      expect(prismaService.claim.update).toHaveBeenCalledWith({
        where: { id: verificationParams.claimId },
        data: {
          oracleRequestId: mockVerificationRequest.requestId,
          status: 'UNDER_REVIEW',
        },
      });

      expect(result).toEqual(mockVerificationRequest);
    });
  });

  describe('getUserPolicies', () => {
    it('should return paginated user policies', async () => {
      const mockPolicies = [mockCoverage];
      const totalCount = 1;

      prismaService.coverage.findMany.mockResolvedValue(mockPolicies);
      prismaService.coverage.count.mockResolvedValue(totalCount);

      const result = await service.getUserPolicies({
        userId: mockUser.id,
        status: 'ACTIVE',
        page: 1,
        limit: 10,
      });

      expect(prismaService.coverage.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, status: 'ACTIVE' },
        include: {
          claims: {
            select: { id: true, status: true, claimAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        data: mockPolicies,
        pagination: {
          page: 1,
          limit: 10,
          total: totalCount,
          pages: 1,
        },
      });
    });
  });

  describe('validateCoverageOwnership', () => {
    it('should validate coverage ownership successfully', async () => {
      prismaService.coverage.findFirst.mockResolvedValue({
        ...mockCoverage,
        claims: [],
      });

      const result = await service.validateCoverageOwnership(mockCoverage.id, mockUser.id);

      expect(prismaService.coverage.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCoverage.id,
          userId: mockUser.id,
        },
        include: {
          claims: true,
        },
      });

      expect(result).toEqual(expect.objectContaining(mockCoverage));
    });

    it('should throw NotFoundException for invalid ownership', async () => {
      prismaService.coverage.findFirst.mockResolvedValue(null);

      await expect(
        service.validateCoverageOwnership(mockCoverage.id, 'wrong-user-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Cache Management', () => {
    it('should use cache for coverage retrieval', async () => {
      const cachedCoverage = { ...mockCoverage, cached: true };

      cacheService.get.mockResolvedValue(cachedCoverage);

      const result = await service.getCoverageById(mockCoverage.id);

      expect(cacheService.get).toHaveBeenCalledWith(`coverage:${mockCoverage.id}`);
      expect(prismaService.coverage.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(cachedCoverage);
    });

    it('should fetch from database and cache when cache miss', async () => {
      cacheService.get.mockResolvedValue(null);
      prismaService.coverage.findUnique.mockResolvedValue({
        ...mockCoverage,
        user: mockUser,
        claims: [],
      });

      const result = await service.getCoverageById(mockCoverage.id);

      expect(cacheService.get).toHaveBeenCalledWith(`coverage:${mockCoverage.id}`);
      expect(prismaService.coverage.findUnique).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        `coverage:${mockCoverage.id}`,
        expect.objectContaining(mockCoverage),
        300
      );
      expect(result).toEqual(expect.objectContaining(mockCoverage));
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      prismaService.coverage.create.mockRejectedValue(new Error('Connection failed'));

      const coverageData = {
        userId: mockUser.id,
        coverageAmount: '100000',
        coveragePeriod: 365 * 24 * 60 * 60,
        coverageType: 'CLINICAL_TRIAL_FAILURE',
        triggerConditions: mockCoverage.triggerConditions,
        premium: '5000',
        riskScore: 70,
        transactionHash: '0xabcdef',
        blockchainId: 'blockchain-123',
        chain: 'solana',
        payWithLives: false,
      };

      await expect(service.createCoverage(coverageData)).rejects.toThrow(BadRequestException);
    });

    it('should handle blockchain service errors', async () => {
      prismaService.claim.findUnique.mockResolvedValue({
        ...mockClaim,
        coverage: mockCoverage,
        user: mockUser,
      });

      blockchainService.processPayout.mockRejectedValue(new Error('Blockchain error'));

      await expect(service.processClaimPayout(mockClaim.id, true)).rejects.toThrow();
    });
  });
});