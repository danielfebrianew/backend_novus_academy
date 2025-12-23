import { PartialType, OmitType } from '@nestjs/mapped-types';
import { RegisterDto } from 'src/auth/dto/register.dto';

export class UpdateUserDto extends PartialType(
  OmitType(RegisterDto, ['password'] as const),
) {}