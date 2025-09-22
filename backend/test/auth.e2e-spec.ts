import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(userData.email);
          expect(res.body.user.username).toBe(userData.username);
          expect(res.body.user).not.toHaveProperty('passwordHash');
        });
    });

    it('should fail to register with invalid email', () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should fail to register with weak password', () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'testuser',
        password: 'SecurePassword123!',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          username: 'logintest',
          password: 'SecurePassword123!',
        });
    });

    it('should login successfully with valid credentials', () => {
      const loginData = {
        email: 'login@example.com',
        password: 'SecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(loginData.email);
        });
    });

    it('should fail to login with invalid email', () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should fail to login with invalid password', () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('/auth/web3/login (POST)', () => {
    it('should login with valid Web3 signature', () => {
      const web3LoginData = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        signature: '0x1234567890abcdef...',
        message: 'BioShield Authentication\n\nWallet: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\nNonce: abc123...',
      };

      return request(app.getHttpServer())
        .post('/auth/web3/login')
        .send(web3LoginData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.walletAddress).toBe(web3LoginData.walletAddress);
        });
    });

    it('should fail to login with invalid signature', () => {
      const web3LoginData = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        signature: 'invalid-signature',
        message: 'BioShield Authentication\n\nWallet: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\nNonce: abc123...',
      };

      return request(app.getHttpServer())
        .post('/auth/web3/login')
        .send(web3LoginData)
        .expect(401);
    });
  });

  describe('/auth/nonce (GET)', () => {
    it('should generate nonce for wallet address', () => {
      const nonceData = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      };

      return request(app.getHttpServer())
        .get('/auth/nonce')
        .send(nonceData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('nonce');
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain(nonceData.walletAddress);
        });
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'profile@example.com',
          username: 'profiletest',
          password: 'SecurePassword123!',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'SecurePassword123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('username');
          expect(res.body.email).toBe('profile@example.com');
          expect(res.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should fail to get profile without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should fail to get profile with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/change-password (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'password@example.com',
          username: 'passwordtest',
          password: 'SecurePassword123!',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'password@example.com',
          password: 'SecurePassword123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should change password successfully', () => {
      const changePasswordData = {
        oldPassword: 'SecurePassword123!',
        newPassword: 'NewSecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Password changed successfully');
        });
    });

    it('should fail to change password with wrong old password', () => {
      const changePasswordData = {
        oldPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordData)
        .expect(401);
    });

    it('should fail to change password with weak new password', () => {
      const changePasswordData = {
        oldPassword: 'SecurePassword123!',
        newPassword: 'weak',
      };

      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordData)
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'refresh@example.com',
          username: 'refreshtest',
          password: 'SecurePassword123!',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePassword123!',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh access token successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
        });
    });

    it('should fail to refresh with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'logout@example.com',
          username: 'logouttest',
          password: 'SecurePassword123!',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'SecurePassword123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toBe('Logged out successfully');
        });
    });
  });
});
