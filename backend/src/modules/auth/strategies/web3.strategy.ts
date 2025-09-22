import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ethers } from 'ethers';
import { AuthService } from '../auth.service';

@Injectable()
export class Web3Strategy extends PassportStrategy(Strategy, 'web3') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      throw new UnauthorizedException('Missing wallet authentication data');
    }

    // Verify signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      throw new UnauthorizedException('Signature verification failed');
    }

    // Find or create user
    const user = await this.authService.web3Login({
      walletAddress,
      signature,
      message,
    });

    return user.user;
  }
}
