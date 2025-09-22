import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';

export class NonceDto {
  @ApiProperty({
    description: 'Wallet address for nonce generation',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @IsEthereumAddress({ message: 'Please provide a valid Ethereum address' })
  walletAddress: string;
}
