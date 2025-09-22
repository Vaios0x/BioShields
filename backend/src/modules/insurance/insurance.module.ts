import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { PolicyService } from './policy.service';
import { ClaimService } from './claim.service';
import { PremiumCalculatorService } from './premium-calculator.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { OracleModule } from '../oracle/oracle.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BlockchainModule, OracleModule, NotificationsModule],
  controllers: [InsuranceController],
  providers: [
    InsuranceService,
    PolicyService,
    ClaimService,
    PremiumCalculatorService,
  ],
  exports: [InsuranceService, PolicyService, ClaimService, PremiumCalculatorService],
})
export class InsuranceModule {}
