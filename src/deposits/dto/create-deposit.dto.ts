import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateDepositDto {
  @IsNumber()
  depositValue: number;

  @IsString()
  @IsNotEmpty()
  depositDescription: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;
}
