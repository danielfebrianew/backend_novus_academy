import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsPhoneNumber('ID', { message: 'Format nomor HP Indonesia tidak valid' })
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  referralCode?: string;
} 