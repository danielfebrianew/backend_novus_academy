import { IsOptional, IsDateString, IsString } from 'class-validator';

export class FilterReportDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}