import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { VideoUtilsHelper } from './helpers/video-utils.helper';
import { AwsStorageService } from '../generate-video/services/aws-storage.service';
import { GalleryService } from '../gallery/gallery.service';

@Injectable()
export class VideoMixerService implements OnModuleInit {
  private readonly logger = new Logger(VideoMixerService.name);
  private readonly tempDir = path.resolve('./temp');
  private readonly uploadsDir = path.resolve('./uploads');

  constructor(
    private readonly videoUtilsHelper: VideoUtilsHelper,
    private readonly awsStorage: AwsStorageService,
    private readonly galleryService: GalleryService,
  ) {
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);
    if (!fs.existsSync(this.uploadsDir)) fs.mkdirSync(this.uploadsDir);
  }

  async onModuleInit() {
    this.cleanFolder(this.uploadsDir);
    this.cleanFolder(this.tempDir);
  }

  private cleanFolder(dir: string) {
    try {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          this.logger.error(`Failed to delete ${filePath}`);
        }
      }
      this.logger.log(`Cleaned ${files.length} files from ${dir}`);
    } catch (error) {
      this.logger.error(`Failed to clean folder ${dir}:`, error);
    }
  }

  async generateStitchedVideos(
    clipPaths: string[],
    audioPath: string,
    targetVariations: number = 1,
    userId: number,
    jobId: string,
    productName: string,
    script: string,
    voiceGender: string
  ) {
    const PROCESS_ID = jobId || uuidv4().split('-')[0];

    // Files to cleanup
    const filesToDelete: string[] = [...clipPaths, audioPath];

    // Save job metadata to DB first to prevent connection timeout
    try {
      await this.galleryService.createJobMetadata(
        userId,
        PROCESS_ID,
        productName,
        script,
        voiceGender,
        clipPaths.length,
        targetVariations,
        clipPaths.map((_, idx) => `Clip ${idx + 1}`),
        [],
        undefined,
      );
      this.logger.log(`[${PROCESS_ID}] Job metadata saved to database`);
    } catch (dbError) {
      this.logger.error(`[${PROCESS_ID}] Failed to save job metadata:`, dbError);
      throw new InternalServerErrorException('Failed to save job metadata to database');
    }

    try {
      this.logProgress(PROCESS_ID, 'Mengenerate urutan unik...', 10);

      const uniqueOrders = this.videoUtilsHelper.generateUniqueShuffles(
        clipPaths.length,
        targetVariations
      );

      this.logProgress(PROCESS_ID, `Memulai Stitching ${uniqueOrders.length} variasi...`, 20);

      const resultUrls: string[] = [];

      for (let i = 0; i < uniqueOrders.length; i++) {
        const order = uniqueOrders[i];
        const orderedPaths = order.map((index) => clipPaths[index]);

        const tempVisualPath = path.join(this.tempDir, `vis_${PROCESS_ID}_${i}.mp4`);
        filesToDelete.push(tempVisualPath);

        await this.videoUtilsHelper.mergeVideoFiles(orderedPaths, tempVisualPath);

        const finalFileName = `VARIATION_${PROCESS_ID}_${i + 1}.mp4`;
        const finalVarPath = path.join(this.tempDir, `VAR_${PROCESS_ID}_${i}.mp4`);
        filesToDelete.push(finalVarPath);

        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(tempVisualPath)
            .input(audioPath)
            .outputOptions(['-c:v copy', '-c:a aac', '-map 0:v:0', '-map 1:a:0'])
            .save(finalVarPath)
            .on('end', () => resolve(true))
            .on('error', (err) => {
              this.logger.error('FFmpeg Error:', err);
              reject(err);
            });
        });

        this.logProgress(PROCESS_ID, `Uploading variasi ${i + 1}...`, 60 + (i / uniqueOrders.length) * 20);

        // Upload to S3
        const s3Url = await this.awsStorage.uploadFile(
          finalVarPath,
          finalFileName,
          'video/mp4',
          `results/${PROCESS_ID}`
        );
        resultUrls.push(s3Url);

        this.logProgress(PROCESS_ID, `Variasi ${i + 1} selesai.`, 80);
      }

      // Add videos to existing job
      this.logProgress(PROCESS_ID, 'Saving videos to gallery...', 90);

      try {
        await this.galleryService.addVideosToJob(
          PROCESS_ID,
          resultUrls[0] || '',
          resultUrls.map((url, idx) => ({
            variationNumber: idx + 1,
            videoUrl: url,
            fileName: `VARIATION_${PROCESS_ID}_${idx + 1}.mp4`
          }))
        );

        this.logger.log(`[${PROCESS_ID}] Successfully saved ${resultUrls.length} videos to gallery`);
      } catch (dbError) {
        this.logger.error(`[${PROCESS_ID}] FAILED to save videos to gallery:`, dbError);
        throw new InternalServerErrorException(
          `Video generation succeeded but failed to save videos to gallery: ${dbError.message || 'Unknown error'}`
        );
      }

      this.logProgress(PROCESS_ID, 'Process completed!', 100);

      return {
        success: true,
        jobId: PROCESS_ID,
        totalVariations: resultUrls.length,
        variations: resultUrls
      };

    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Gagal memproses video');
    } finally {
        // --- CLEANUP EKSEKUTOR ---
        // Ini akan menghapus file di 'uploads/' DAN file di 'temp/'
        console.log(`[${PROCESS_ID}] Membersihkan ${filesToDelete.length} file temporary & uploads...`);
        
        filesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error(`Gagal menghapus file: ${filePath}`, err);
                }
            }
        });
    }
  }

  private logProgress(id: string, message: string, percent: number) {
    console.log(`[${id}] ${percent}% - ${message}`);
  }
}