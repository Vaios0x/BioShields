import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Patch,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Web3LoginDto } from './dto/web3-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { NonceDto } from './dto/nonce.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'MODERATOR'] },
            status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user with email and password credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
            lastLoginAt: { type: 'string', format: 'date-time' },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('web3/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with Web3 wallet',
    description: 'Authenticate user using wallet signature verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Web3 login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid signature',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async web3Login(@Body() web3LoginDto: Web3LoginDto) {
    return this.authService.web3Login(web3LoginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate nonce for Web3 authentication',
    description: 'Generate a unique nonce for wallet signature verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce generated successfully',
    schema: {
      type: 'object',
      properties: {
        nonce: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async generateNonce(@Body() nonceDto: NonceDto) {
    const nonce = await this.authService.generateNonce(nonceDto.walletAddress);
    const message = `BioShield Authentication\n\nWallet: ${nonceDto.walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
    
    return {
      nonce,
      message,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get current user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Request() req) {
    return this.authService.getUserById(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update current user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.authService.updateUser(req.user.id, updateData);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change current user password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid old password',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Post('link-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Link wallet to user account',
    description: 'Link a Web3 wallet to existing user account',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet linked successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid signature',
  })
  @ApiResponse({
    status: 409,
    description: 'Wallet already linked to another account',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async linkWallet(@Request() req, @Body() linkWalletDto: LinkWalletDto) {
    await this.authService.linkWallet(
      req.user.id,
      linkWalletDto.walletAddress,
      linkWalletDto.signature,
      linkWalletDto.message,
    );
    return { message: 'Wallet linked successfully' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logout current user and invalidate session',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  async logout(@Request() req) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }
}
