import { IsEnum, IsOptional } from 'class-validator';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UserRole } from '../entities/user.entity'; 

export class CreateUserDto extends RegisterDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}