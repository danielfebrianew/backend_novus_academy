import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateGenerateProDto } from './dto/create-generate-pro.dto';
import { AwsStorageService } from './services/aws-storage.service';
import { KieVideoService } from './services/kie-video.service';
import { OpenAiPromptService } from './services/openai-prompt.service';

export class KieCallbackData {
  taskId: string;
  state: 'success' | 'fail';
  resultJson: string | null;
  failCode: string | null;
  failMsg: string | null;
  model: string;
  completeTime: number;
  costTime: number;
  createTime: number;
  param: string;
}

export class KieCallbackPayload {
  code: number;
  data: KieCallbackData;
  msg: string;
}

@Injectable()
export class GenerateProService {
  private readonly logger = new Logger(GenerateProService.name);

  constructor(
    private readonly kieVideoService: KieVideoService,
    private readonly openAiPromptService: OpenAiPromptService,
    private readonly awsStorageService: AwsStorageService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submitTask(dto: CreateGenerateProDto, file: Express.Multer.File, _userId: number) {
    const reqId = dto.jobId;
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');
    const callBackUrl = `${appBaseUrl}/generate-pro/callback`;
    const progressCallBackUrl = `${appBaseUrl}/generate-pro/progress-callback`;

    // Step 1: Upload image ke S3
    this.logProgress(reqId, 'Uploading product image...', 5);
    const ext = file.mimetype.split('/')[1];
    const imageUrl = await this.awsStorageService.uploadFile(
      file.buffer,
      `${reqId}-${Date.now()}.${ext}`,
      file.mimetype,
      'generate-pro',
    );

    // Step 2: Generate structured Sora prompt via GPT-4o Vision
    this.logProgress(reqId, 'Generating video prompt...', 15);
    const videoPrompt = await this.openAiPromptService.generateVideoPrompt(
      imageUrl,
      dto.productTitle,
      dto.productDescription,
    );

    // Step 3: Submit ke Kie.ai (aspect_ratio dan n_frames di-lock)
    this.logProgress(reqId, 'Submitting task to Kie.ai...', 30);
    const taskId = await this.kieVideoService.createTask(
      videoPrompt,
      'portrait',
      '10',
      callBackUrl,
      progressCallBackUrl,
      reqId,
    );

    this.logProgress(reqId, 'Task submitted to Kie.ai', 40);
    return { jobId: reqId, taskId, imageUrl, generatedPrompt: videoPrompt };
  }

  handleCallback(payload: KieCallbackPayload) {
    const { data } = payload;
    const jobId = data.taskId;

    if (data.state === 'success') {
      let resultUrls: string[] = [];
      try {
        resultUrls = JSON.parse(data.resultJson ?? '{}').resultUrls ?? [];
      } catch {
        this.logger.error(`[${jobId}] Failed to parse resultJson`);
      }

      this.logger.log(`[${jobId}] Video generated successfully`);
      this.eventEmitter.emit('pro.job.progress', {
        jobId,
        message: 'success',
        progress: 100,
        resultUrls,
      });
    } else {
      this.logger.error(`[${jobId}] Task failed: ${data.failMsg}`);
      this.eventEmitter.emit('pro.job.progress', {
        jobId,
        message: 'failed',
        progress: -1,
        failMsg: data.failMsg,
      });
    }
  }

  private logProgress(jobId: string, message: string, progress: number) {
    this.logger.log(`[${jobId}] ${message} (${progress}%)`);
    this.eventEmitter.emit('pro.job.progress', { jobId, message, progress });
  }
}
