import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up data before each test
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.governanceVote.deleteMany();
  await prisma.governanceProposal.deleteMany();
  await prisma.bridgeTransaction.deleteMany();
  await prisma.rewardDistribution.deleteMany();
  await prisma.liquidityPosition.deleteMany();
  await prisma.liquidityPool.deleteMany();
  await prisma.oracleRequest.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.insurancePolicy.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();
});
