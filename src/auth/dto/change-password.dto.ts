import { IsNotEmpty, IsString, MinLength, NotEquals } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  newPassword: string;
}