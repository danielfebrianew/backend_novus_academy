// generate-image.controller.ts
import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Req,
  Logger,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GenerateImageService } from './generate-image.service';
import { GenerateImageRequestDto } from './dto/generate-image.dto';

@Controller('generate-image')
@UseInterceptors()
export class GenerateImageController {
  private readonly logger = new Logger(GenerateImageController.name);

  constructor(private readonly generateImageService: GenerateImageService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'modelImage', maxCount: 1 },    // optional — kalau tidak ada, AI generate face
      { name: 'productImage', maxCount: 1 },  // required
    ]),
  )
  async generateImages(
    @UploadedFiles()
    files: {
      modelImage?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
    @Body() body: GenerateImageRequestDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.userId || 'temp-user-id';

    // productImage wajib ada
    if (!files?.productImage?.[0]) {
      throw new BadRequestException('productImage is required.');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const productFile = files.productImage[0];
    const modelFile = files.modelImage?.[0] || null; // null kalau tidak di-upload

    // Validasi mimetype — cek productImage selalu, modelImage kalau ada
    if (!allowedTypes.includes(productFile.mimetype)) {
      throw new BadRequestException('Invalid file type for productImage.');
    }
    if (modelFile && !allowedTypes.includes(modelFile.mimetype)) {
      throw new BadRequestException('Invalid file type for modelImage.');
    }

    return await this.generateImageService.generateImage(
      body,
      { modelImage: modelFile, productImage: productFile },
      userId,
    );
  }
}