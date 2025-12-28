import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString({ message: 'Username harus berupa string' })
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  username: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @IsOptional()
  @IsString()
  cookie?: string;

  @IsOptional()
  @IsString()
  status?: string;
}