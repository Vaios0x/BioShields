import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core modules
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { LiquidityModule } from './modules/liquidity/liquidity.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { BridgeModule } from './modules/bridge/bridge.module';

// Configuration
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Event system
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Queue system
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
    }),

    // Core modules
    DatabaseModule,
    AuthModule,
    InsuranceModule,
    BlockchainModule,
    OracleModule,
    LiquidityModule,
    AnalyticsModule,
    IpfsModule,
    NotificationsModule,
    GovernanceModule,
    BridgeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
