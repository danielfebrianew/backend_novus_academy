import { Injectable, Logger, OnModuleInit, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

import { AwsStorageService } from './services/aws-storage.service';
import { OpenAiScriptService } from './services/openai-script.service';
import { WavespeedVideoService } from './services/wavespeed-video.service';
import { GeminiTtsService } from './services/gemini-tts.service';
import { FfmpegMixService } from './services/ffmpeg-mixer.service';
import { VideoUtilsHelper } from './helpers/video-utils.helper';

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
    private ffmpegMix: FfmpegMixService,
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

  async processVideoVariations(images: string[], prompts: string[], script: string, jobId: string, targetCount: number, voiceGender: string) {
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

    switch (promptCount) {
      case 4:
        if (targetCount < 4 || targetCount > 20) {
          throw new BadRequestException(`Untuk 4 prompt, variasi video harus antara 4 sampai 20. Kamu minta: ${targetCount}`);
        }
        break;

      case 5:
        if (targetCount < 5 || targetCount > 50) {
          throw new BadRequestException(`Untuk 5 prompt, variasi video harus antara 5 sampai 50. Kamu minta: ${targetCount}`);
        }
        break;

      case 6:
        if (targetCount < 6 || targetCount > 100) {
          throw new BadRequestException(`Untuk 6 prompt, variasi video harus antara 6 sampai 100. Kamu minta: ${targetCount}`);
        }
        break;

      default:
        throw new BadRequestException(`Jumlah prompt harus 4, 5, atau 6. Kamu kirim ${promptCount}.`);
    }

    try {
      this.logProgress(jobId, "=== STARTING AI ENGINE ===", 5);

      const videoTasks = prompts.map(async (prompt, idx) => {
        const selectedImage = images[idx] ? images[idx] : images[0];
        try {
          const url = await this.wavespeedVideo.generateVideo(prompt, selectedImage, idx, jobId);
          return { status: 'success', url, index: idx };
        } catch (err) {
          return { status: 'failed', error: err, index: idx };
        }
      });

      this.logProgress(jobId, "Generating Video & Audio assets...", 10);

      const audioTask = this.geminiTts.generateAudio(script, this.tempDir, voiceName);

      const [videoResults, audioPath] = await Promise.all([
        Promise.all(videoTasks),
        audioTask
      ]);
      cleanupFiles.push(audioPath);

      const successVideos = videoResults
        .filter((r): r is { status: 'success', url: string, index: number } => r.status === 'success')
        .sort((a, b) => a.index - b.index);

      if (successVideos.length !== promptCount) throw new Error("Failed to generate all video clips.");

      const rawClipPaths: string[] = [];
      let downloadedCount = 0;

      for (const vid of successVideos) {
        const rawFileName = path.join(this.tempDir, `raw_${jobId}_${vid.index}.mp4`);
        downloadedCount++;

        const percent = 20 + Math.round((downloadedCount / successVideos.length) * 20);
        this.logProgress(jobId, `Downloading Clip #${vid.index + 1}...`, percent);

        await this.videoUtilsHelper.downloadFile(vid.url, rawFileName);
        rawClipPaths.push(rawFileName);
        cleanupFiles.push(rawFileName);
      }

      const uniqueOrders = this.videoUtilsHelper.generateUniqueShuffles(promptCount, targetCount);
      this.logProgress(jobId, `Stitching ${uniqueOrders.length} variations...`, 40);

      const resultUrls: string[] = [];

      for (let i = 0; i < uniqueOrders.length; i++) {
        const order = uniqueOrders[i];
        const orderedPaths = order.map(index => rawClipPaths[index]);

        const tempVisualPath = path.join(this.tempDir, `vis_${jobId}_${i}.mp4`);
        cleanupFiles.push(tempVisualPath);

        await this.ffmpegMix.stitchVisuals(orderedPaths, tempVisualPath);

        const finalFileName = `VARIATION_${jobId}_${i + 1}.mp4`;
        const finalVarPath = path.join(this.tempDir, `VAR_${jobId}_${i}.mp4`);
        cleanupFiles.push(finalVarPath);

        await this.ffmpegMix.mergeAudioVisual(tempVisualPath, audioPath, finalVarPath);

        const percent = 40 + Math.round(((i + 1) / uniqueOrders.length) * 55);
        this.logProgress(jobId, `Uploading Variation ${i + 1}/${uniqueOrders.length}...`, percent);

        const s3Url = await this.awsStorage.uploadFile(finalVarPath, finalFileName, 'video/mp4', `results/${jobId}`);
        resultUrls.push(s3Url);
      }

      this.cleanup(cleanupFiles);
      this.logProgress(jobId, "Process Completed!", 100);

      return {
        jobId,
        totalVariations: resultUrls.length,
        variations: resultUrls
      };

    } catch (error) {
      this.cleanup(cleanupFiles);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[${jobId}] ERROR: ${msg}`);
      throw new InternalServerErrorException(msg);
    }
  }
}