import { IsDateString, IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  account_id: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsNumber()
  live_revenue: number;

  @IsNumber()
  video_revenue: number;

  @IsNumber()
  revenue: number;

  @IsNumber()
  base_revenue: number;

  @IsNumber()
  est_komisi: number;

  @IsNumber()
  sold: number;

  @IsNumber()
  view: number;

  @IsNumber()
  click: number;
}