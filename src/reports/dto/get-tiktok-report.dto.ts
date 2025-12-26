import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTiktokReportDto {
  @IsNotEmpty()
  @Type(() => Number) // Convert string "4" jadi number 4
  @IsNumber()
  accountId: number;

  @IsNotEmpty()
  @IsDateString() // Pastikan format YYYY-MM-DD
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}