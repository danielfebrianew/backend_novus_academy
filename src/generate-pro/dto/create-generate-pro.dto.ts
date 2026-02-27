import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGenerateProDto {
  @IsString()
  @IsNotEmpty()
  productTitle: string;

  @IsString()
  @IsNotEmpty()
  productDescription: string;

  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsOptional()
  faceCharacter?: string;

  @IsString()
  @IsOptional()
  customFaceCharacter?: string;
}
