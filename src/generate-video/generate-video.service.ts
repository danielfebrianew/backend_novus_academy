import { Injectable, Logger, OnModuleInit, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

import { AwsStorageService } from './services/aws-storage.service';
import { OpenAiScriptService } from './services/openai-script.service';
import { WavespeedVideoService } from './services/wavespeed-video.service';
import { GeminiTtsService } from './services/gemini-tts.service';
import { VideoUtilsHelper } from './helpers/video-utils.helper';
import { GalleryService } from 'src/gallery/gallery.service';

@Injectable()
export class GenerateAiService implements OnModuleInit {
  private readonly logger = new Logger(GenerateAiService.name);
  private tempDir = './temp';

  constructor(
    private eventEmitter: EventEmitter2,
    private videoUtilsHelper: VideoUtilsHelper,
    private awsStorage: AwsStorageService,
    private openaiScript: OpenAiScriptService,
    private wavespeedVideo: WavespeedVideoService,
    private geminiTts: GeminiTtsService,
    private galleryService: GalleryService,
  ) {
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);
  }

  async onModuleInit() {
    this.cleanTempFolder();
  }

  private cleanTempFolder() {
    try {
      if (!fs.existsSync(this.tempDir)) return;
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        if (file.endsWith('.mp4') || file.endsWith('.zip') || file.endsWith('.wav')) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      this.logger.error('Failed to clean temp folder:', error);
    }
  }

  private cleanup(files: string[]) {
    files.forEach(f => {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) { this.logger.error(`Cleanup failed for ${f}`); }
      }
    });
  }

  private logProgress(jobId: string, message: string, progress: number) {
    this.logger.log(`[${jobId}] ${message}`);
    this.eventEmitter.emit('job.progress', { jobId, message, progress });
  }

  private async downloadToBuffer(url: string): Promise<Buffer> {
    const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  async uploadImages(files: Array<Express.Multer.File>) {
    const urls: string[] = [];
    for (const file of files) {
      const fileName = `input_${Date.now()}_${Math.round(Math.random() * 1000)}_${file.originalname}`;
      const url = await this.awsStorage.uploadFile(file.buffer, fileName, file.mimetype, 'inputs');
      urls.push(url);
    }
    return { imageUrls: urls };
  }

  async generateText(imageUrl: string, count: number, product: string) {
    return await this.openaiScript.analyzeImageAndCreateScript(imageUrl, count, product);
  }

  async uploadProcessedVideo(
    fileBuffer: Buffer,
    contentType: string,
    jobId: string,
    variationIndex: number,
  ) {
    const fileName = `variation_${variationIndex}.mp4`;
    const folder = `generate/${jobId}`;

    const s3Url = await this.awsStorage.uploadFile(
      fileBuffer,
      fileName,
      contentType,
      folder,
    );

    await this.galleryService.upsertVideoToJob(jobId, variationIndex, s3Url, fileName);

    this.logger.log(`[${jobId}] Video variation ${variationIndex} uploaded by client`);

    return { url: s3Url };
  }

  async processVideoVariations(images: string[], productName: string, prompts: string[], script: string, jobId: string, targetCount: number, voiceGender: string, userId: number) {
    let cleanupFiles: string[] = [];
    const promptCount = prompts.length;

    // --- LOGIC RANDOM VOICE PICKER ---
    let voiceName = 'Achernar';

    if (voiceGender === 'male') {
      const maleVoices = ['Alnilam', 'Achird', 'Zubenelgenubi'];
      voiceName = maleVoices[Math.floor(Math.random() * maleVoices.length)];
    } else {
      const femaleVoices = ['Achernar', 'Zephyr', 'Sulafat'];
      voiceName = femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
    }

    this.logger.log(`Job ${jobId}: Gender '${voiceGender}' -> Selected Voice: '${voiceName}'`);

    // Validation
    if (promptCount < 4 || promptCount > 6) {
      throw new BadRequestException(`Jumlah prompt harus antara 4-6. Kamu kirim ${promptCount}.`);
    }

    if (targetCount < 1 || targetCount > 100) {
      throw new BadRequestException(`Jumlah variasi video harus antara 1-100. Kamu minta: ${targetCount}`);
    }

    // Save job metadata to DB first to prevent connection timeout
    try {
      await this.galleryService.createJobMetadata(
        userId,
        jobId,
        productName,
        script,
        voiceGender,
        prompts.length,
        targetCount,
        prompts,
        images,
        images[0],
      );
      this.logger.log(`[${jobId}] Job metadata saved to database`);
    } catch (dbError) {
      this.logger.error(`[${jobId}] Failed to save job metadata:`, dbError);
      throw new InternalServerErrorException('Failed to save job metadata to database');
    }

    try {
      this.logProgress(jobId, "=== STARTING AI ENGINE ===", 0);

      // STEP 1: Generate video clips (0-15%)
      this.logProgress(jobId, "Generating video clips...", 5);

      const videoTasks = prompts.map(async (prompt, idx) => {
        const selectedImage = images[idx] ? images[idx] : images[0];
        try {
          const url = await this.wavespeedVideo.generateVideo(prompt, selectedImage, idx, jobId);
          return { status: 'success' as const, url, index: idx };
        } catch (err) {
          return { status: 'failed' as const, error: err, index: idx };
        }
      });

      // STEP 2: Generate audio in parallel (5-15%)
      this.logProgress(jobId, "Generating voiceover...", 10);

      const audioTask = this.geminiTts.generateAudio(script, this.tempDir, voiceName);

      const [videoResults, audioPath] = await Promise.all([
        Promise.all(videoTasks),
        audioTask
      ]);
      cleanupFiles.push(audioPath);

      // STEP 3: Validate clips (15-20%)
      this.logProgress(jobId, "Validating video clips...", 15);

      const successVideos = videoResults
        .filter((r): r is { status: 'success', url: string, index: number } => r.status === 'success')
        .sort((a, b) => a.index - b.index);

      if (successVideos.length !== promptCount) {
        throw new Error(`Failed to generate all video clips. Got ${successVideos.length}/${promptCount}`);
      }

      // STEP 4: Upload raw clips to S3 (20-60%)
      this.logProgress(jobId, `Uploading ${successVideos.length} raw clips to S3...`, 20);

      const clipUrls: string[] = [];
      const totalClips = successVideos.length;

      for (let i = 0; i < totalClips; i++) {
        const vid = successVideos[i];
        const clipFileName = `clip_${vid.index}.mp4`;

        const uploadProgress = 20 + Math.floor(((i + 1) / totalClips) * 40);
        this.logProgress(jobId, `Uploading clip ${i + 1}/${totalClips} to S3...`, uploadProgress);

        const clipBuffer = await this.downloadToBuffer(vid.url);
        const s3ClipUrl = await this.awsStorage.uploadFile(
          clipBuffer,
          clipFileName,
          'video/mp4',
          `assets/${jobId}`,
        );
        clipUrls.push(s3ClipUrl);
      }

      // STEP 5: Upload audio to S3 (60-70%)
      this.logProgress(jobId, "Uploading audio to S3...", 65);

      const audioS3Url = await this.awsStorage.uploadFile(
        audioPath,
        'audio.wav',
        'audio/wav',
        `assets/${jobId}`,
      );

      // STEP 6: Generate unique shuffles (70-80%)
      this.logProgress(jobId, `Creating ${targetCount} unique variation orders...`, 75);

      const uniqueOrders = this.videoUtilsHelper.generateUniqueShuffles(promptCount, targetCount);

      // Build per-variation clipUrls (ordered by that variation's shuffle)
      const variations = uniqueOrders.map((order, idx) => ({
        variationIndex: idx + 1,
        clipUrls: order.map(clipIdx => clipUrls[clipIdx]),
        audioUrl: audioS3Url,
      }));

      // Cleanup temp files
      this.cleanup(cleanupFiles);

      this.logProgress(jobId, "Raw assets ready. Awaiting client processing.", 100);

      return {
        jobId,
        totalVariations: variations.length,
        variations,
      };

    } catch (error) {
      this.cleanup(cleanupFiles);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[${jobId}] ERROR: ${msg}`);

      this.logProgress(jobId, `Error: ${msg}`, 0);

      throw new InternalServerErrorException(msg);
    }
  }
}
