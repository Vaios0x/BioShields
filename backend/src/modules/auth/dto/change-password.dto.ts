import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123!',
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  oldPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(100, { message: 'New password must not exceed 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  newPassword: string;
}
