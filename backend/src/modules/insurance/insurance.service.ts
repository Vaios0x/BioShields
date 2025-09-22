import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { OracleService } from '../oracle/oracle.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { CacheService } from '../cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BigNumber } from 'ethers';

interface CalculatePremiumParams {
  coverageAmount: string;
  coveragePeriod: number;
  coverageType: string;
  riskProfile: any;
  payWithLives: boolean;
  userTier: string;
}

interface CreateCoverageData {
  userId: string;
  coverageAmount: string;
  coveragePeriod: number;
  coverageType: string;
  triggerConditions: any;
  premium: string;
  riskScore: number;
  transactionHash: string;
  blockchainId: string;
  chain: string;
  ipfsHash?: string;
  payWithLives: boolean;
}

interface CreateClaimData {
  userId: string;
  coverageId: string;
  claimAmount: string;
  claimType: string;
  evidenceHash: string;
  transactionHash: string;
  status: string;
  urgent?: boolean;
}

@Injectable()
export class InsuranceService {
  private readonly logger = new Logger(InsuranceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly oracleService: OracleService,
    private readonly ipfsService: IpfsService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async calculatePremium(params: CalculatePremiumParams): Promise<any> {
    const {
      coverageAmount,
      coveragePeriod,
      coverageType,
      riskProfile,
      payWithLives,
      userTier,
    } = params;

    this.logger.log(`Calculating premium for ${coverageType}, amount: ${coverageAmount}`);

    // Base premium calculation using risk multiplier
    let basePremium = BigNumber.from(coverageAmount)
      .mul(this.getRiskMultiplier(riskProfile.score))
      .div(10000);

    // Period adjustment (annualized to actual period)
    const periodInDays = coveragePeriod / (24 * 60 * 60);
    basePremium = basePremium.mul(periodInDays).div(365);

    // Market conditions adjustment
    const marketConditions = await this.getMarketConditions();
    const marketMultiplier = BigNumber.from(Math.floor(marketConditions.volatilityIndex * 100));
    basePremium = basePremium.mul(marketMultiplier).div(100);

    // Pool utilization adjustment
    const utilizationRate = await this.getPoolUtilization();
    if (utilizationRate > 80) {
      basePremium = basePremium.mul(120).div(100); // 20% increase
    } else if (utilizationRate < 30) {
      basePremium = basePremium.mul(90).div(100); // 10% discount
    }

    // User tier discount
    const tierDiscount = this.getTierDiscount(userTier);
    basePremium = basePremium.mul(100 - tierDiscount).div(100);

    // LIVES token discount (50%)
    let finalPremium = basePremium;
    let livesDiscount = 0;
    if (payWithLives) {
      livesDiscount = 50;
      finalPremium = basePremium.mul(50).div(100);
    }

    const breakdown = {
      basePremium: basePremium.toString(),
      finalPremium: finalPremium.toString(),
      riskMultiplier: this.getRiskMultiplier(riskProfile.score),
      marketAdjustment: marketConditions.volatilityIndex,
      utilizationAdjustment: utilizationRate,
      tierDiscount,
      livesDiscount,
      periodInDays,
    };

    this.logger.log(`Premium calculation completed: ${JSON.stringify(breakdown)}`);

    return breakdown;
  }

  async createCoverage(data: CreateCoverageData) {
    this.logger.log(`Creating coverage in database for user ${data.userId}`);

    try {
      const coverage = await this.prisma.coverage.create({
        data: {
          userId: data.userId,
          coverageAmount: data.coverageAmount,
          premium: data.premium,
          coverageType: data.coverageType,
          triggerConditions: data.triggerConditions,
          startDate: new Date(),
          endDate: new Date(Date.now() + data.coveragePeriod * 1000),
          status: 'ACTIVE',
          riskScore: data.riskScore,
          transactionHash: data.transactionHash,
          blockchainId: data.blockchainId,
          chain: data.chain,
          ipfsHash: data.ipfsHash,
          paidWithLives: data.payWithLives,
          metadata: {
            createdAt: new Date().toISOString(),
            version: '1.0',
          },
        },
        include: {
          user: {
            select: { id: true, walletAddress: true, email: true },
          },
        },
      });

      // Emit event for analytics
      this.eventEmitter.emit('coverage.created', {
        coverageId: coverage.id,
        userId: data.userId,
        amount: data.coverageAmount,
        type: data.coverageType,
        chain: data.chain,
      });

      // Update cache
      await this.cacheService.del(`user:${data.userId}:coverages`);

      this.logger.log(`Coverage created successfully: ${coverage.id}`);
      return coverage;
    } catch (error) {
      this.logger.error(`Failed to create coverage: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create coverage');
    }
  }

  async createClaim(data: CreateClaimData) {
    this.logger.log(`Creating claim for coverage ${data.coverageId}`);

    // Validate coverage exists and belongs to user
    const coverage = await this.prisma.coverage.findFirst({
      where: {
        id: data.coverageId,
        userId: data.userId,
        status: 'ACTIVE',
      },
    });

    if (!coverage) {
      throw new NotFoundException('Coverage not found or not active');
    }

    // Check claim amount doesn't exceed remaining coverage
    const existingClaims = await this.prisma.claim.aggregate({
      where: {
        coverageId: data.coverageId,
        status: { in: ['APPROVED', 'PAID'] },
      },
      _sum: { claimAmount: true },
    });

    const totalClaimed = Number(existingClaims._sum.claimAmount || 0);
    const remainingCoverage = Number(coverage.coverageAmount) - totalClaimed;

    if (Number(data.claimAmount) > remainingCoverage) {
      throw new BadRequestException('Claim amount exceeds remaining coverage');
    }

    try {
      const claim = await this.prisma.claim.create({
        data: {
          coverageId: data.coverageId,
          userId: data.userId,
          claimAmount: data.claimAmount,
          claimType: data.claimType,
          evidenceHash: data.evidenceHash,
          status: data.status,
          urgent: data.urgent || false,
          submittedAt: new Date(),
          transactionHash: data.transactionHash,
          metadata: {
            submissionMethod: 'api',
            userAgent: 'web',
            ipAddress: 'masked',
          },
        },
        include: {
          coverage: {
            select: { id: true, coverageType: true, triggerConditions: true },
          },
        },
      });

      // Emit event
      this.eventEmitter.emit('claim.submitted', {
        claimId: claim.id,
        coverageId: data.coverageId,
        userId: data.userId,
        amount: data.claimAmount,
        urgent: data.urgent,
      });

      this.logger.log(`Claim created successfully: ${claim.id}`);
      return claim;
    } catch (error) {
      this.logger.error(`Failed to create claim: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create claim');
    }
  }

  async processClaimPayout(claimId: string, approved: boolean, reason?: string) {
    this.logger.log(`Processing payout for claim ${claimId}: ${approved ? 'approved' : 'rejected'}`);

    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        coverage: true,
        user: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (approved) {
      // Process payout on blockchain
      const txResult = await this.blockchainService.processPayout({
        claimId: claim.id,
        amount: claim.claimAmount,
        recipient: claim.user.walletAddress,
        payInLives: claim.coverage.paidWithLives,
        chain: claim.coverage.chain,
      });

      // Update claim status
      const updatedClaim = await this.prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          payoutTransactionHash: txResult.transactionHash,
          processorNotes: 'Automatically approved via oracle verification',
        },
      });

      // Update coverage total claimed
      await this.prisma.coverage.update({
        where: { id: claim.coverageId },
        data: {
          totalClaimed: {
            increment: Number(claim.claimAmount),
          },
        },
      });

      // Emit event
      this.eventEmitter.emit('claim.approved', {
        claimId,
        amount: claim.claimAmount,
        transactionHash: txResult.transactionHash,
      });

      this.logger.log(`Claim ${claimId} approved and paid out`);
      return updatedClaim;
    } else {
      // Reject claim
      const updatedClaim = await this.prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          rejectionReason: reason || 'Failed oracle verification',
        },
      });

      // Emit event
      this.eventEmitter.emit('claim.rejected', {
        claimId,
        reason: reason || 'Failed oracle verification',
      });

      this.logger.log(`Claim ${claimId} rejected: ${reason}`);
      return updatedClaim;
    }
  }

  async getCoverageById(id: string) {
    const cacheKey = `coverage:${id}`;

    // Try cache first
    let coverage = await this.cacheService.get(cacheKey);

    if (!coverage) {
      coverage = await this.prisma.coverage.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, walletAddress: true, email: true },
          },
          claims: {
            orderBy: { submittedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!coverage) {
        throw new NotFoundException('Coverage not found');
      }

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, coverage, 300);
    }

    return coverage;
  }

  async getClaimById(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        coverage: {
          select: { id: true, coverageType: true, coverageAmount: true },
        },
        user: {
          select: { id: true, email: true, walletAddress: true },
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return claim;
  }

  async getUserPolicies(params: {
    userId: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { userId, status, page, limit } = params;
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [coverages, total] = await Promise.all([
      this.prisma.coverage.findMany({
        where,
        include: {
          claims: {
            select: { id: true, status: true, claimAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.coverage.count({ where }),
    ]);

    return {
      data: coverages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async validateCoverageOwnership(coverageId: string, userId: string) {
    const coverage = await this.prisma.coverage.findFirst({
      where: {
        id: coverageId,
        userId,
      },
      include: {
        claims: true,
      },
    });

    if (!coverage) {
      throw new NotFoundException('Coverage not found');
    }

    return coverage;
  }

  async uploadEvidenceToIPFS(evidence: any) {
    this.logger.log('Uploading evidence to IPFS');

    try {
      const ipfsHash = await this.ipfsService.uploadFile(evidence);
      this.logger.log(`Evidence uploaded to IPFS: ${ipfsHash}`);
      return ipfsHash;
    } catch (error) {
      this.logger.error(`IPFS upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload evidence');
    }
  }

  async requestOracleVerification(params: {
    claimId: string;
    evidenceHash: string;
    triggerConditions: any;
    urgency: boolean;
  }) {
    this.logger.log(`Requesting oracle verification for claim ${params.claimId}`);

    try {
      const verificationRequest = await this.oracleService.requestVerification({
        claimId: params.claimId,
        evidenceHash: params.evidenceHash,
        triggerConditions: params.triggerConditions,
        urgent: params.urgency,
      });

      // Store oracle request reference
      await this.prisma.claim.update({
        where: { id: params.claimId },
        data: {
          oracleRequestId: verificationRequest.requestId,
          status: 'UNDER_REVIEW',
        },
      });

      this.logger.log(`Oracle verification requested: ${verificationRequest.requestId}`);
      return verificationRequest;
    } catch (error) {
      this.logger.error(`Oracle verification request failed: ${error.message}`);
      throw error;
    }
  }

  async getOracleVerificationStatus(claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      select: { oracleRequestId: true },
    });

    if (!claim?.oracleRequestId) {
      return { status: 'not_requested' };
    }

    return await this.oracleService.getVerificationStatus(claim.oracleRequestId);
  }

  async getClaimTimeline(claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        submittedAt: true,
        processedAt: true,
        status: true,
        oracleRequestId: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    const timeline = [
      {
        event: 'SUBMITTED',
        timestamp: claim.submittedAt,
        description: 'Claim submitted and evidence uploaded',
      },
    ];

    if (claim.oracleRequestId) {
      timeline.push({
        event: 'ORACLE_VERIFICATION_STARTED',
        timestamp: claim.submittedAt, // Approximate
        description: 'Oracle verification process initiated',
      });
    }

    if (claim.processedAt) {
      timeline.push({
        event: claim.status,
        timestamp: claim.processedAt,
        description: `Claim ${claim.status.toLowerCase()}`,
      });
    }

    return timeline;
  }

  async updateCoverageStatus(id: string, status: string, txHash?: string) {
    const updateData: any = { status };
    if (txHash) {
      updateData.cancellationTxHash = txHash;
    }

    const coverage = await this.prisma.coverage.update({
      where: { id },
      data: updateData,
    });

    // Clear cache
    await this.cacheService.del(`coverage:${id}`);

    return coverage;
  }

  async getCoverageClaims(coverageId: string) {
    return await this.prisma.claim.findMany({
      where: { coverageId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // Scheduled tasks
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiringCoverages() {
    this.logger.log('Checking for expiring coverages');

    const expiringCoverages = await this.prisma.coverage.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    for (const coverage of expiringCoverages) {
      // Send expiration notification
      this.eventEmitter.emit('coverage.expiring', {
        coverageId: coverage.id,
        userEmail: coverage.user.email,
        expirationDate: coverage.endDate,
      });
    }

    this.logger.log(`Found ${expiringCoverages.length} expiring coverages`);
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async updateMarketConditions() {
    this.logger.log('Updating market conditions');

    // Fetch latest market data and update cache
    const marketData = await this.fetchMarketConditions();
    await this.cacheService.set('market:conditions', marketData, 21600); // 6 hours

    this.logger.log('Market conditions updated');
  }

  // Private helper methods
  private getRiskMultiplier(riskScore: number): number {
    if (riskScore < 30) return 300;  // 3%
    if (riskScore < 50) return 500;  // 5%
    if (riskScore < 70) return 800;  // 8%
    return 1200; // 12%
  }

  private getTierDiscount(tier: string): number {
    switch (tier) {
      case 'PREMIUM': return 15;
      case 'GOLD': return 10;
      case 'SILVER': return 5;
      default: return 0;
    }
  }

  private async getPoolUtilization(): Promise<number> {
    const cacheKey = 'pool:utilization';
    let utilization = await this.cacheService.get(cacheKey);

    if (utilization === null) {
      const poolData = await this.blockchainService.getAggregatedPoolData();
      utilization = (poolData.totalCoverage / poolData.totalLiquidity) * 100;

      // Cache for 10 minutes
      await this.cacheService.set(cacheKey, utilization, 600);
    }

    return utilization;
  }

  private async getMarketConditions(): Promise<any> {
    const cacheKey = 'market:conditions';
    let conditions = await this.cacheService.get(cacheKey);

    if (!conditions) {
      conditions = await this.fetchMarketConditions();
      await this.cacheService.set(cacheKey, conditions, 3600); // 1 hour
    }

    return conditions;
  }

  private async fetchMarketConditions(): Promise<any> {
    // Simulate market conditions (in production, fetch from real sources)
    return {
      volatilityIndex: 1.0 + (Math.random() - 0.5) * 0.2, // ±10%
      bioSectorSentiment: Math.random() > 0.5 ? 'positive' : 'negative',
      regulatoryEnvironment: 'stable',
      lastUpdated: new Date().toISOString(),
    };
  }
}