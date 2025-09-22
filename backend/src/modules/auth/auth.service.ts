import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { ethers } from 'ethers';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Web3LoginDto } from './dto/web3-login.dto';
import { User, UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const { email, password, username, walletAddress } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          ...(walletAddress ? [{ walletAddress }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email, username, or wallet address already exists');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('security.bcryptRounds');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        walletAddress,
        isWalletVerified: !!walletAddress,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`New user registered: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async web3Login(web3LoginDto: Web3LoginDto): Promise<AuthResponse> {
    const { walletAddress, signature, message } = web3LoginDto;

    // Verify signature
    const isValidSignature = this.verifySignature(walletAddress, message, signature);
    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      // Create new user with wallet
      user = await this.prisma.user.create({
        data: {
          email: `${walletAddress}@wallet.local`, // Temporary email
          walletAddress,
          isWalletVerified: true,
          status: UserStatus.ACTIVE,
        },
      });

      this.logger.log(`New wallet user created: ${walletAddress}`);
    } else {
      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`Wallet user logged in: ${walletAddress}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn'),
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      return user;
    }

    return null;
  }

  async getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('User not found or no password set');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const saltRounds = this.configService.get<number>('security.bcryptRounds');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    this.logger.log(`Password changed for user: ${user.email}`);
  }

  async linkWallet(userId: string, walletAddress: string, signature: string, message: string): Promise<void> {
    // Verify signature
    const isValidSignature = this.verifySignature(walletAddress, message, signature);
    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Check if wallet is already linked
    const existingUser = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Wallet address is already linked to another account');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress,
        isWalletVerified: true,
      },
    });

    this.logger.log(`Wallet linked for user: ${userId}`);
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  private verifySignature(address: string, message: string, signature: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      return false;
    }
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store nonce in Redis or database with expiration
    // For now, we'll return a simple nonce
    return nonce;
  }

  async logout(userId: string): Promise<void> {
    // In a real implementation, you might want to blacklist the token
    // or store it in Redis with an expiration time
    this.logger.log(`User logged out: ${userId}`);
  }
}
