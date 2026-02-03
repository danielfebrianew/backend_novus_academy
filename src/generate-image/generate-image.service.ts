import { Injectable, Logger } from '@nestjs/common';
import { GeminiImageGenService } from './services/gemini-image-gen.service';
import { AwsStorageService } from './services/aws-storage.service';
import {
  GenerateImageRequestDto,
  GenerateImageResponse,
  ImageVariant,
} from './dto/generate-image.dto';
import { v4 as uuidv4 } from 'uuid'; // pastikan "uuid" ada di package.json
import { generateJobId } from './helpers/generate-job-id.helper';

@Injectable()
export class GenerateImageService {
  private readonly logger = new Logger(GenerateImageService.name);

  // 6 pose → akan generate 6 variant per request
  private readonly poseVariations = [
    'front facing with confident smile',
    'slight side angle showing product details',
    'three-quarter view with natural expression',
    'standing pose holding the product',
    'casual pose showcasing the product',
    'dynamic pose demonstrating product use',
  ];

  constructor(
    private readonly geminiImageGenService: GeminiImageGenService,
    private readonly awsStorageService: AwsStorageService,
  ) {}

  /**
   * Entry point dari controller.
   * Signature cocok dengan cara controller memanggil:
   *   generateImage(body, { modelImage, productImage }, userId)
   */
  async generateImage(
    dto: GenerateImageRequestDto,
    files: { modelImage: Express.Multer.File; productImage: Express.Multer.File },
    userId: string,
  ): Promise<GenerateImageResponse> {
    const startTime = Date.now();
    const jobId = generateJobId();

    // Konversi file upload → base64 string (Gemini butuh ini)
    const modelBase64 = files.modelImage.buffer.toString('base64');
    const productBase64 = files.productImage.buffer.toString('base64');

    // Generate semua variant secara parallel
    const variantPromises = this.poseVariations.map((pose, index) =>
      this.generateSingleVariant({
        jobId,
        productName: dto.productName,
        additionalPrompt: dto.additionalPrompt,
        pose,
        variantNumber: index + 1,
        modelBase64,
        productBase64,
        userId,
      }),
    );

    const variants: ImageVariant[] = await Promise.all(variantPromises);

    // Hitung statistik
    const successfulVariants = variants.filter((v) => v.imageUrl !== null).length;

    return {
      jobId: jobId,
      totalVariants: variants.length,
      successfulVariants,
      failedVariants: variants.length - successfulVariants,
      variants,
      processingTime: Date.now() - startTime,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Generate + upload 1 variant. Dikall per-pose.
   * Catch error per-variant agar satu yang gagal tidak nge-block yang lain.
   */
  private async generateSingleVariant(params: {
    jobId: string;
    productName: string;
    additionalPrompt?: string;
    pose: string;
    variantNumber: number;
    modelBase64: string;
    productBase64: string;
    userId: string;
  }): Promise<ImageVariant> {
    try {
      this.logger.log(`Generating variant ${params.variantNumber}: "${params.pose}"`);

      // 1. Bangun prompt
      const prompt = this.buildPrompt(
        params.productName,
        params.pose,
        params.additionalPrompt,
      );

      // 2. Kirim ke Gemini → dapat Buffer gambar
      const imageBuffer = await this.geminiImageGenService.generateImage({
        prompt,
        modelBase64: params.modelBase64,
        productBase64: params.productBase64,
      });

      // 3. Upload ke S3
      const fileName = `${uuidv4()}.png`;
      const folder = `generated-images/${params.userId}`;

      const imageUrl = await this.awsStorageService.uploadFile(
        imageBuffer,
        fileName,
        'image/png',
        folder,
      );

      this.logger.log(`Variant ${params.variantNumber} berhasil → ${imageUrl}`);

      return {
        variantNumber: params.variantNumber,
        imageUrl,
        error: null,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Variant ${params.variantNumber} gagal: ${error.message}`,
      );

      return {
        variantNumber: params.variantNumber,
        imageUrl: null,
        error: error.message,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Bangun prompt lengkap untuk Gemini.
   */
  private buildPrompt(
    productName: string,
    pose: string,
    additionalPrompt?: string,
  ): string {
    const basePrompt = `Professional studio photography of a model wearing/using ${productName}.

CRITICAL REQUIREMENTS:
- Model MUST have the EXACT same face as reference image (facial features, skin tone, expression)
- Product MUST match the reference product exactly (design, colors, details)
- Pose: ${pose}
- Background: Complementary solid color or subtle gradient that harmonizes with model's skin tone
- Professional studio lighting with soft shadows
- High-end commercial product photography style
- Sharp focus on both model and product
- Clean, minimal aesthetic suitable for e-commerce/affiliate marketing
- Photorealistic quality, 4K resolution

Style: Professional, polished, editorial quality similar to high-end brand campaigns.
${additionalPrompt ? `Additional instructions: ${additionalPrompt}` : ''}`;

    return basePrompt.trim();
  }
}