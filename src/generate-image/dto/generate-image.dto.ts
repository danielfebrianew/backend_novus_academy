import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateImageRequestDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsOptional()
  additionalPrompt?: string;

  @IsOptional() 
  modelImageUrl?: string; 

  @IsOptional()
  productImageUrl?: string;
}

export interface ImageVariant {
  variantNumber: number;
  imageUrl: string | null;
  error: string | null;
  createdAt: Date;
}

export interface GenerateImageResponse {
  jobId: string;
  totalVariants: number;
  successfulVariants: number;
  failedVariants: number;
  variants: ImageVariant[];
  processingTime: number;
}
