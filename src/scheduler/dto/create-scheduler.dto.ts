import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { PostStatus } from '../entities/scheduler.entity';

export class CreateSchedulerDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Account ID harus diisi' })
  accountId: number;

  @IsString()
  @IsNotEmpty({ message: 'Username harus diisi' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Video URL harus diisi' })
  // @IsUrl({}, { message: 'Format URL video tidak valid' }) // Opsional: aktifkan jika ingin strict
  videoUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'Content/Caption harus diisi' })
  content: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsDateString({}, { message: 'Format waktu tidak valid (Gunakan ISO 8601)' })
  @IsNotEmpty({ message: 'Waktu tayang harus diisi' })
  scheduledTime: string; // Frontend mengirim dalam format String ISO

  @IsOptional()
  @IsEnum(PostStatus)
  statusPost?: PostStatus;
}