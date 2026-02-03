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
import { GenerateImageRequestDto } from './dto/generate-image.dto'; // ✅ Fix: nama class yang benar
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('generate-image')
@UseInterceptors(ResponseInterceptor)
export class GenerateImageController {
  private readonly logger = new Logger(GenerateImageController.name);

  constructor(private readonly generateImageService: GenerateImageService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'modelImage', maxCount: 1 },
      { name: 'productImage', maxCount: 1 },
    ]),
  )
  async generateImages(
    @UploadedFiles()
    files: {
      modelImage?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
    @Body() body: GenerateImageRequestDto, // ✅ Fix: pakai nama yang sesuai export
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.userId || 'temp-user-id';

    if (!files || !files.modelImage?.[0] || !files.productImage?.[0]) {
      throw new BadRequestException('Both modelImage and productImage are required.');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const modelFile = files.modelImage[0];
    const productFile = files.productImage[0];

    if (!allowedTypes.includes(modelFile.mimetype) || !allowedTypes.includes(productFile.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // Signature service sekarang cocok: (dto, files, userId)
    return await this.generateImageService.generateImage(
      body,
      { modelImage: modelFile, productImage: productFile },
      userId,
    );
  }
}