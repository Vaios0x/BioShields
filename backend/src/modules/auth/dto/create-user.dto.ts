import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsEthereumAddress } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Username (optional)',
    example: 'johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username?: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  @ApiProperty({
    description: 'Wallet address (optional)',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    required: false,
  })
  @IsOptional()
  @IsEthereumAddress({ message: 'Please provide a valid Ethereum address' })
  walletAddress?: string;
}
