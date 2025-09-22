import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCoverageDto } from './dto/create-coverage.dto';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { CalculatePremiumDto } from './dto/calculate-premium.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';

@ApiTags('insurance')
@Controller('insurance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(CacheInterceptor)
export class InsuranceController {
  private readonly logger = new Logger(InsuranceController.name);

  constructor(
    private readonly insuranceService: InsuranceService,
    private readonly blockchainService: BlockchainService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('coverage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new insurance coverage',
    description: 'Creates a new insurance policy with specified parameters and processes payment',
  })
  @ApiResponse({
    status: 201,
    description: 'Coverage created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          coverageAmount: '100000',
          premium: '5000',
          coverageType: 'CLINICAL_TRIAL_FAILURE',
          status: 'ACTIVE',
          transactionHash: '0x...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid coverage parameters' })
  @ApiResponse({ status: 402, description: 'Insufficient funds' })
  @Throttle(5, 60) // 5 requests per minute
  async createCoverage(
    @CurrentUser() user: User,
    @Body(ValidationPipe) dto: CreateCoverageDto,
  ) {
    this.logger.log(`Creating coverage for user ${user.id}: ${JSON.stringify(dto)}`);

    try {
      // Risk assessment
      const riskProfile = await this.analyticsService.assessRisk({
        coverageType: dto.coverageType,
        amount: dto.coverageAmount,
        period: dto.coveragePeriod,
        userHistory: user.id,
        ipfsHash: dto.ipfsHash,
      });

      this.logger.log(`Risk assessment completed: ${JSON.stringify(riskProfile)}`);

      // Calculate premium with market conditions
      const premiumData = await this.insuranceService.calculatePremium({
        ...dto,
        riskProfile,
        payWithLives: dto.payWithLives,
        userTier: user.tier || 'BASIC',
      });

      this.logger.log(`Premium calculated: ${premiumData.finalPremium}`);

      // Validate user's balance
      if (dto.payWithLives) {
        const livesBalance = await this.blockchainService.getLivesBalance(user.walletAddress);
        if (Number(livesBalance) < Number(premiumData.finalPremium)) {
          throw new Error('Insufficient LIVES token balance');
        }
      }

      // Create coverage on blockchain
      const txResult = await this.blockchainService.createCoverage({
        userAddress: user.walletAddress,
        coverageAmount: dto.coverageAmount,
        coveragePeriod: dto.coveragePeriod,
        premium: premiumData.finalPremium,
        triggerConditions: dto.triggerConditions,
        payWithLives: dto.payWithLives,
        ipfsHash: dto.ipfsHash,
        chain: dto.preferredChain || 'solana',
      });

      this.logger.log(`Blockchain transaction: ${txResult.transactionHash}`);

      // Store coverage in database
      const coverage = await this.insuranceService.createCoverage({
        userId: user.id,
        ...dto,
        premium: premiumData.finalPremium,
        riskScore: riskProfile.score,
        transactionHash: txResult.transactionHash,
        blockchainId: txResult.coverageId,
        chain: dto.preferredChain || 'solana',
      });

      // Send confirmation notification
      await this.notificationsService.sendCoverageConfirmation(
        user.email,
        coverage,
        txResult,
      );

      // Update user statistics
      await this.analyticsService.updateUserStats(user.id, {
        totalCoverageAmount: Number(dto.coverageAmount),
        policiesCreated: 1,
      });

      this.logger.log(`Coverage created successfully: ${coverage.id}`);

      return {
        success: true,
        data: {
          coverage,
          transaction: txResult,
          riskProfile,
          premiumBreakdown: premiumData,
        },
      };
    } catch (error) {
      this.logger.error(`Coverage creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('premium/calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate insurance premium',
    description: 'Calculates premium amount based on coverage parameters and risk assessment',
  })
  @ApiResponse({
    status: 200,
    description: 'Premium calculated successfully',
    schema: {
      example: {
        basePremium: '5000',
        finalPremium: '2500',
        discount: '50',
        riskMultiplier: '1.2',
        breakdown: {
          riskFactor: '4000',
          marketConditions: '500',
          userDiscount: '2500',
        },
      },
    },
  })
  async calculatePremium(
    @CurrentUser() user: User,
    @Body(ValidationPipe) dto: CalculatePremiumDto,
  ) {
    this.logger.log(`Calculating premium for user ${user.id}`);

    const riskProfile = await this.analyticsService.assessRisk({
      coverageType: dto.coverageType,
      amount: dto.coverageAmount,
      period: dto.coveragePeriod,
      userHistory: user.id,
    });

    const premiumData = await this.insuranceService.calculatePremium({
      ...dto,
      riskProfile,
      payWithLives: dto.payWithLives,
      userTier: user.tier || 'BASIC',
    });

    return premiumData;
  }

  @Get('coverage/:id')
  @ApiOperation({ summary: 'Get coverage details' })
  @ApiParam({ name: 'id', description: 'Coverage ID' })
  @ApiResponse({ status: 200, description: 'Coverage details retrieved' })
  @ApiResponse({ status: 404, description: 'Coverage not found' })
  async getCoverage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const coverage = await this.insuranceService.getCoverageById(id);

    // Verify ownership
    if (coverage.userId !== user.id) {
      throw new Error('Unauthorized access to coverage');
    }

    // Fetch real-time on-chain data
    const onChainData = await this.blockchainService.getCoverageData(
      coverage.blockchainId,
      coverage.chain,
    );

    // Get claim history
    const claims = await this.insuranceService.getCoverageClaims(id);

    return {
      ...coverage,
      onChain: onChainData,
      claims,
      utilization: (Number(coverage.totalClaimed) / Number(coverage.coverageAmount)) * 100,
    };
  }

  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit insurance claim',
    description: 'Submits a new claim for an active insurance policy',
  })
  @ApiResponse({ status: 201, description: 'Claim submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid claim data' })
  @ApiResponse({ status: 403, description: 'Coverage not eligible for claims' })
  @Throttle(3, 60) // 3 claims per minute max
  async submitClaim(
    @CurrentUser() user: User,
    @Body(ValidationPipe) dto: SubmitClaimDto,
  ) {
    this.logger.log(`Submitting claim for user ${user.id}: ${JSON.stringify(dto)}`);

    // Validate coverage ownership and status
    const coverage = await this.insuranceService.validateCoverageOwnership(
      dto.coverageId,
      user.id,
    );

    // Upload evidence to IPFS
    const evidenceHash = await this.insuranceService.uploadEvidenceToIPFS(dto.evidence);

    // Submit claim on blockchain
    const txResult = await this.blockchainService.submitClaim({
      coverageId: coverage.blockchainId,
      claimAmount: dto.claimAmount,
      evidenceHash,
      claimType: dto.claimType,
      chain: coverage.chain,
    });

    // Store claim in database
    const claim = await this.insuranceService.createClaim({
      userId: user.id,
      coverageId: dto.coverageId,
      ...dto,
      evidenceHash,
      transactionHash: txResult.transactionHash,
      status: 'PENDING',
    });

    // Initialize oracle verification
    await this.insuranceService.requestOracleVerification({
      claimId: claim.id,
      evidenceHash,
      triggerConditions: coverage.triggerConditions,
      urgency: dto.urgent || false,
    });

    // Send notification
    await this.notificationsService.sendClaimSubmissionConfirmation(
      user.email,
      claim,
      coverage,
    );

    this.logger.log(`Claim submitted successfully: ${claim.id}`);

    return {
      success: true,
      data: {
        claim,
        transaction: txResult,
        estimatedProcessingTime: '24-72 hours',
      },
    };
  }

  @Get('claims/:id/status')
  @ApiOperation({ summary: 'Get claim status and timeline' })
  @ApiParam({ name: 'id', description: 'Claim ID' })
  async getClaimStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const claim = await this.insuranceService.getClaimById(id);

    // Verify ownership
    if (claim.userId !== user.id) {
      throw new Error('Unauthorized access to claim');
    }

    const oracleStatus = await this.insuranceService.getOracleVerificationStatus(id);
    const timeline = await this.insuranceService.getClaimTimeline(id);

    return {
      claim,
      oracleStatus,
      timeline,
      estimatedCompletion: this.calculateEstimatedCompletion(claim, oracleStatus),
    };
  }

  @Get('user/policies')
  @ApiOperation({ summary: 'Get user insurance policies' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'EXHAUSTED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserPolicies(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const policies = await this.insuranceService.getUserPolicies({
      userId: user.id,
      status,
      page: Math.max(1, page),
      limit: Math.min(50, Math.max(1, limit)),
    });

    // Add real-time blockchain data for active policies
    const enrichedPolicies = await Promise.all(
      policies.data.map(async (policy) => {
        if (policy.status === 'ACTIVE') {
          const onChainData = await this.blockchainService.getCoverageData(
            policy.blockchainId,
            policy.chain,
          );
          return { ...policy, onChain: onChainData };
        }
        return policy;
      }),
    );

    return {
      ...policies,
      data: enrichedPolicies,
    };
  }

  @Get('analytics/risk-metrics')
  @ApiOperation({ summary: 'Get risk assessment metrics' })
  async getRiskMetrics() {
    return await this.analyticsService.getRiskMetrics();
  }

  @Get('analytics/pool-stats')
  @ApiOperation({ summary: 'Get insurance pool statistics' })
  async getPoolStats() {
    const solanaStats = await this.blockchainService.getPoolStats('solana');
    const baseStats = await this.blockchainService.getPoolStats('base');

    return {
      overall: {
        totalValueLocked: Number(solanaStats.tvl) + Number(baseStats.tvl),
        totalCoverageAmount: Number(solanaStats.coverage) + Number(baseStats.coverage),
        totalClaims: Number(solanaStats.claims) + Number(baseStats.claims),
        utilizationRate: this.calculateUtilizationRate(solanaStats, baseStats),
      },
      byChain: {
        solana: solanaStats,
        base: baseStats,
      },
    };
  }

  @Put('coverage/:id/cancel')
  @ApiOperation({ summary: 'Cancel active coverage' })
  @ApiParam({ name: 'id', description: 'Coverage ID' })
  async cancelCoverage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const coverage = await this.insuranceService.validateCoverageOwnership(id, user.id);

    if (coverage.status !== 'ACTIVE') {
      throw new Error('Only active coverages can be cancelled');
    }

    // Process cancellation on blockchain
    const txResult = await this.blockchainService.cancelCoverage(
      coverage.blockchainId,
      coverage.chain,
    );

    // Update database
    const updatedCoverage = await this.insuranceService.updateCoverageStatus(
      id,
      'CANCELLED',
      txResult.transactionHash,
    );

    // Calculate and process refund
    const refundAmount = await this.calculateCancellationRefund(coverage);
    if (refundAmount > 0) {
      await this.blockchainService.processRefund(
        user.walletAddress,
        refundAmount,
        coverage.paidWithLives,
        coverage.chain,
      );
    }

    // Send notification
    await this.notificationsService.sendCancellationConfirmation(
      user.email,
      updatedCoverage,
      refundAmount,
    );

    return {
      success: true,
      data: {
        coverage: updatedCoverage,
        refundAmount,
        transaction: txResult,
      },
    };
  }

  // Private helper methods
  private calculateEstimatedCompletion(claim: any, oracleStatus: any): string {
    // Logic to calculate estimated completion time based on claim status and oracle processing
    const baseProcessingTime = 24; // hours
    const complexityMultiplier = claim.claimType === 'FULL_COVERAGE' ? 1.5 : 1;
    const oracleDelayFactor = oracleStatus.pending ? 1.2 : 1;

    const estimatedHours = baseProcessingTime * complexityMultiplier * oracleDelayFactor;
    const completionDate = new Date(Date.now() + estimatedHours * 60 * 60 * 1000);

    return completionDate.toISOString();
  }

  private calculateUtilizationRate(solanaStats: any, baseStats: any): number {
    const totalTVL = Number(solanaStats.tvl) + Number(baseStats.tvl);
    const totalCoverage = Number(solanaStats.coverage) + Number(baseStats.coverage);

    return totalTVL > 0 ? (totalCoverage / totalTVL) * 100 : 0;
  }

  private async calculateCancellationRefund(coverage: any): Promise<number> {
    const timeElapsed = Date.now() - new Date(coverage.startDate).getTime();
    const totalPeriod = new Date(coverage.endDate).getTime() - new Date(coverage.startDate).getTime();
    const timeRemainingRatio = Math.max(0, (totalPeriod - timeElapsed) / totalPeriod);

    // Apply cancellation fee (10%)
    const cancellationFee = 0.1;
    const refundRatio = Math.max(0, timeRemainingRatio - cancellationFee);

    return Number(coverage.premium) * refundRatio;
  }
}