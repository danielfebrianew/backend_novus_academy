import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AwsStorageService } from '../generate-video/services/aws-storage.service';
import { GalleryService } from '../gallery/gallery.service';

@Injectable()
export class VideoMixerService {
  private readonly logger = new Logger(VideoMixerService.name);

  constructor(
    private readonly awsStorage: AwsStorageService,
    private readonly galleryService: GalleryService,
  ) {}

  async uploadProcessedVideo(
    fileBuffer: Buffer,
    contentType: string,
    userId: number,
    jobId: string,
    variationIndex: number,
    productName: string,
    script: string,
    voiceGender: string,
  ) {
    const fileName = `variation_${variationIndex}.mp4`;
    const folder = `video-mixer/${jobId}`;

    const s3Url = await this.awsStorage.uploadFile(
      fileBuffer,
      fileName,
      contentType,
      folder,
    );

    // Ensure job metadata exists, create if not
    try {
      await this.galleryService.upsertVideoToJob(jobId, variationIndex, s3Url, fileName);
    } catch (err) {
      if (err instanceof NotFoundException) {
        await this.galleryService.createJobMetadata(
          userId,
          jobId,
          productName,
          script,
          voiceGender,
          0,
          1,
          [],
          [],
        );
        await this.galleryService.upsertVideoToJob(jobId, variationIndex, s3Url, fileName);
      } else {
        throw err;
      }
    }

    this.logger.log(`[${jobId}] Video variation ${variationIndex} uploaded to S3`);

    return { url: s3Url };
  }
}
