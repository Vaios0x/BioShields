import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('Insurance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.cleanup();

    // Register and login to get access token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'insurance@example.com',
        username: 'insurancetest',
        password: 'SecurePassword123!',
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'insurance@example.com',
        password: 'SecurePassword123!',
      });

    accessToken = loginResponse.body.accessToken;
  });

  describe('/insurance/policies (POST)', () => {
    it('should create a new insurance policy successfully', () => {
      const policyData = {
        type: 'CLINICAL_TRIAL_FAILURE',
        coverageAmount: 500000,
        duration: 365,
        triggerConditions: {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: 100000,
          customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        riskFactors: {
          trialPhase: 2,
          indication: 'oncology',
          duration: 365,
        },
        network: 'SOLANA',
        payWithLives: false,
        metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
      };

      return request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(policyData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('policyNumber');
          expect(res.body).toHaveProperty('type');
          expect(res.body).toHaveProperty('coverageAmount');
          expect(res.body).toHaveProperty('premium');
          expect(res.body).toHaveProperty('status');
          expect(res.body.type).toBe(policyData.type);
          expect(res.body.coverageAmount).toBe(policyData.coverageAmount);
          expect(res.body.status).toBe('ACTIVE');
        });
    });

    it('should create policy with LIVES token discount', () => {
      const policyData = {
        type: 'REGULATORY_REJECTION',
        coverageAmount: 1000000,
        duration: 180,
        triggerConditions: {
          clinicalTrialFailure: false,
          regulatoryRejection: true,
          ipInvalidation: false,
          minimumThreshold: 200000,
          customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        riskFactors: {
          agency: 'FDA',
          indication: 'neurology',
          duration: 180,
        },
        network: 'BASE',
        payWithLives: true,
        metadataURI: 'https://ipfs.io/ipfs/QmTestHash2',
      };

      return request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(policyData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('premium');
          expect(res.body.payWithLives).toBe(true);
          // Premium should be discounted (this would be calculated by the service)
        });
    });

    it('should fail to create policy with invalid coverage amount', () => {
      const policyData = {
        type: 'CLINICAL_TRIAL_FAILURE',
        coverageAmount: 100, // Too low
        duration: 365,
        triggerConditions: {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: 100000,
          customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        riskFactors: {
          trialPhase: 2,
          indication: 'oncology',
          duration: 365,
        },
        network: 'SOLANA',
        payWithLives: false,
        metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
      };

      return request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(policyData)
        .expect(400);
    });

    it('should fail to create policy without authentication', () => {
      const policyData = {
        type: 'CLINICAL_TRIAL_FAILURE',
        coverageAmount: 500000,
        duration: 365,
        triggerConditions: {
          clinicalTrialFailure: true,
          regulatoryRejection: false,
          ipInvalidation: false,
          minimumThreshold: 100000,
          customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        riskFactors: {
          trialPhase: 2,
          indication: 'oncology',
          duration: 365,
        },
        network: 'SOLANA',
        payWithLives: false,
        metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
      };

      return request(app.getHttpServer())
        .post('/insurance/policies')
        .send(policyData)
        .expect(401);
    });
  });

  describe('/insurance/policies (GET)', () => {
    beforeEach(async () => {
      // Create a test policy
      await request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'CLINICAL_TRIAL_FAILURE',
          coverageAmount: 500000,
          duration: 365,
          triggerConditions: {
            clinicalTrialFailure: true,
            regulatoryRejection: false,
            ipInvalidation: false,
            minimumThreshold: 100000,
            customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          riskFactors: {
            trialPhase: 2,
            indication: 'oncology',
            duration: 365,
          },
          network: 'SOLANA',
          payWithLives: false,
          metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
        });
    });

    it('should get user policies successfully', () => {
      return request(app.getHttpServer())
        .get('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('type');
          expect(res.body[0]).toHaveProperty('coverageAmount');
          expect(res.body[0]).toHaveProperty('status');
        });
    });

    it('should filter policies by status', () => {
      return request(app.getHttpServer())
        .get('/insurance/policies?status=ACTIVE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((policy: any) => {
            expect(policy.status).toBe('ACTIVE');
          });
        });
    });

    it('should filter policies by type', () => {
      return request(app.getHttpServer())
        .get('/insurance/policies?type=CLINICAL_TRIAL_FAILURE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((policy: any) => {
            expect(policy.type).toBe('CLINICAL_TRIAL_FAILURE');
          });
        });
    });
  });

  describe('/insurance/policies/:id (GET)', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a test policy
      const response = await request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'CLINICAL_TRIAL_FAILURE',
          coverageAmount: 500000,
          duration: 365,
          triggerConditions: {
            clinicalTrialFailure: true,
            regulatoryRejection: false,
            ipInvalidation: false,
            minimumThreshold: 100000,
            customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          riskFactors: {
            trialPhase: 2,
            indication: 'oncology',
            duration: 365,
          },
          network: 'SOLANA',
          payWithLives: false,
          metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
        });

      policyId = response.body.id;
    });

    it('should get policy by ID successfully', () => {
      return request(app.getHttpServer())
        .get(`/insurance/policies/${policyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('type');
          expect(res.body).toHaveProperty('coverageAmount');
          expect(res.body).toHaveProperty('premium');
          expect(res.body).toHaveProperty('status');
          expect(res.body.id).toBe(policyId);
        });
    });

    it('should fail to get non-existent policy', () => {
      return request(app.getHttpServer())
        .get('/insurance/policies/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail to get policy without authentication', () => {
      return request(app.getHttpServer())
        .get(`/insurance/policies/${policyId}`)
        .expect(401);
    });
  });

  describe('/insurance/claims (POST)', () => {
    let policyId: string;

    beforeEach(async () => {
      // Create a test policy
      const response = await request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'CLINICAL_TRIAL_FAILURE',
          coverageAmount: 500000,
          duration: 365,
          triggerConditions: {
            clinicalTrialFailure: true,
            regulatoryRejection: false,
            ipInvalidation: false,
            minimumThreshold: 100000,
            customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          riskFactors: {
            trialPhase: 2,
            indication: 'oncology',
            duration: 365,
          },
          network: 'SOLANA',
          payWithLives: false,
          metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
        });

      policyId = response.body.id;
    });

    it('should submit claim successfully', () => {
      const claimData = {
        policyId,
        amount: 100000,
        claimType: 'FULL_COVERAGE',
        evidence: {
          description: 'Clinical trial failed in Phase II',
          documents: ['https://ipfs.io/ipfs/QmEvidence1', 'https://ipfs.io/ipfs/QmEvidence2'],
          trialId: 'NCT12345678',
        },
        evidenceURI: 'https://ipfs.io/ipfs/QmClaimEvidence',
      };

      return request(app.getHttpServer())
        .post('/insurance/claims')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(claimData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('claimNumber');
          expect(res.body).toHaveProperty('policyId');
          expect(res.body).toHaveProperty('amount');
          expect(res.body).toHaveProperty('status');
          expect(res.body.policyId).toBe(policyId);
          expect(res.body.amount).toBe(claimData.amount);
          expect(res.body.status).toBe('PENDING');
        });
    });

    it('should fail to submit claim for non-existent policy', () => {
      const claimData = {
        policyId: 'non-existent-policy-id',
        amount: 100000,
        claimType: 'FULL_COVERAGE',
        evidence: {
          description: 'Clinical trial failed in Phase II',
          documents: ['https://ipfs.io/ipfs/QmEvidence1'],
          trialId: 'NCT12345678',
        },
        evidenceURI: 'https://ipfs.io/ipfs/QmClaimEvidence',
      };

      return request(app.getHttpServer())
        .post('/insurance/claims')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(claimData)
        .expect(404);
    });

    it('should fail to submit claim exceeding coverage amount', () => {
      const claimData = {
        policyId,
        amount: 1000000, // Exceeds coverage amount of 500000
        claimType: 'FULL_COVERAGE',
        evidence: {
          description: 'Clinical trial failed in Phase II',
          documents: ['https://ipfs.io/ipfs/QmEvidence1'],
          trialId: 'NCT12345678',
        },
        evidenceURI: 'https://ipfs.io/ipfs/QmClaimEvidence',
      };

      return request(app.getHttpServer())
        .post('/insurance/claims')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(claimData)
        .expect(400);
    });
  });

  describe('/insurance/claims (GET)', () => {
    let policyId: string;
    let claimId: string;

    beforeEach(async () => {
      // Create a test policy
      const policyResponse = await request(app.getHttpServer())
        .post('/insurance/policies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'CLINICAL_TRIAL_FAILURE',
          coverageAmount: 500000,
          duration: 365,
          triggerConditions: {
            clinicalTrialFailure: true,
            regulatoryRejection: false,
            ipInvalidation: false,
            minimumThreshold: 100000,
            customConditionsHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          riskFactors: {
            trialPhase: 2,
            indication: 'oncology',
            duration: 365,
          },
          network: 'SOLANA',
          payWithLives: false,
          metadataURI: 'https://ipfs.io/ipfs/QmTestHash',
        });

      policyId = policyResponse.body.id;

      // Create a test claim
      const claimResponse = await request(app.getHttpServer())
        .post('/insurance/claims')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          policyId,
          amount: 100000,
          claimType: 'FULL_COVERAGE',
          evidence: {
            description: 'Clinical trial failed in Phase II',
            documents: ['https://ipfs.io/ipfs/QmEvidence1'],
            trialId: 'NCT12345678',
          },
          evidenceURI: 'https://ipfs.io/ipfs/QmClaimEvidence',
        });

      claimId = claimResponse.body.id;
    });

    it('should get policy claims successfully', () => {
      return request(app.getHttpServer())
        .get(`/insurance/policies/${policyId}/claims`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('policyId');
          expect(res.body[0]).toHaveProperty('amount');
          expect(res.body[0]).toHaveProperty('status');
          expect(res.body[0].policyId).toBe(policyId);
        });
    });

    it('should filter claims by status', () => {
      return request(app.getHttpServer())
        .get(`/insurance/policies/${policyId}/claims?status=PENDING`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((claim: any) => {
            expect(claim.status).toBe('PENDING');
          });
        });
    });
  });

  describe('/insurance/stats (GET)', () => {
    it('should get pool statistics successfully', () => {
      return request(app.getHttpServer())
        .get('/insurance/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalCoverage');
          expect(res.body).toHaveProperty('totalPremiums');
          expect(res.body).toHaveProperty('activePolicies');
          expect(res.body).toHaveProperty('totalPayouts');
          expect(res.body).toHaveProperty('totalClaims');
          expect(typeof res.body.totalCoverage).toBe('number');
          expect(typeof res.body.totalPremiums).toBe('number');
          expect(typeof res.body.activePolicies).toBe('number');
          expect(typeof res.body.totalPayouts).toBe('number');
          expect(typeof res.body.totalClaims).toBe('number');
        });
    });
  });
});
