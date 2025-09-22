import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  // Create logger instance
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: 'bioshield-api' },
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: logger,
    }),
  });

  // Security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://bioshield.insurance',
      'https://app.bioshield.insurance',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Performance
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Swagger Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BioShield Insurance API')
      .setDescription('Decentralized Science Insurance Platform API')
      .setVersion('1.0')
      .setContact(
        'BioShield Team',
        'https://bioshield.insurance',
        'tech@bioshield.insurance',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('insurance', 'Insurance coverage management')
      .addTag('claims', 'Claims processing')
      .addTag('liquidity', 'Liquidity pool operations')
      .addTag('analytics', 'Analytics and metrics')
      .addTag('oracle', 'Oracle data verification')
      .addTag('blockchain', 'Blockchain interactions')
      .addServer('http://localhost:4000', 'Local development')
      .addServer('https://api.bioshield.insurance', 'Production')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey}_${methodKey}`,
    });

    SwaggerModule.setup('api-docs', app, document, {
      customSiteTitle: 'BioShield API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .topbar-wrapper { content: url(/logo.png); height: 80px; }
        .swagger-ui .topbar { background-color: #1e293b; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showRequestHeaders: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Health check endpoint
  app.getHttpServer().on('request', (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      }));
    }
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.info(`🚀 BioShield Insurance API running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${port}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  logger.info(`📊 Redis: ${process.env.REDIS_URL ? 'Connected' : 'Not configured'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});