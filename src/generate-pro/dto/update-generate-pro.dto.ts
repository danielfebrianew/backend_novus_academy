import { PartialType } from '@nestjs/mapped-types';
import { CreateGenerateProDto } from './create-generate-pro.dto';

export class UpdateGenerateProDto extends PartialType(CreateGenerateProDto) {}
