import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEthereumAddress, MinLength } from 'class-validator';

export class LinkWalletDto {
  @ApiProperty({
    description: 'Wallet address to link',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @IsEthereumAddress({ message: 'Please provide a valid Ethereum address' })
  walletAddress: string;

  @ApiProperty({
    description: 'Signature of the message',
    example: '0x1234567890abcdef...',
  })
  @IsString()
  @MinLength(1, { message: 'Signature is required' })
  signature: string;

  @ApiProperty({
    description: 'Original message that was signed',
    example: 'BioShield Authentication\n\nWallet: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6\nNonce: abc123...',
  })
  @IsString()
  @MinLength(1, { message: 'Message is required' })
  message: string;
}
