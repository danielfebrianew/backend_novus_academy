import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Req,
  Sse,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Observable, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { CreateGenerateProDto } from './dto/create-generate-pro.dto';
import { GenerateProService, KieCallbackPayload } from './generate-pro.service';
import { GalleryService } from 'src/gallery/gallery.service';

@Controller('generate-pro')
@UseInterceptors(ResponseInterceptor)
export class GenerateProController {
  constructor(
    private readonly generateProService: GenerateProService,
    private readonly galleryService: GalleryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @SkipThrottle()
  @Sse('progress/:jobId')
  @UseGuards(JwtAuthGuard)
  sse(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'pro.job.progress').pipe(
      filter((payload: any) => payload.jobId === jobId),
      map((payload: any) => ({
        data: {
          message: payload.message,
          progress: payload.progress ?? null,
          status: payload.progress === 100 ? 'success'
            : payload.progress === -1 ? 'failed'
            : 'processing',
          resultUrls: payload.resultUrls ?? null,
          failMsg: payload.failMsg ?? null,
        },
      })) as any,
    );
  }

  @Throttle({ heavy: { limit: 2, ttl: 60000 } })
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage('Task submitted to Kie.ai')
  async createTask(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGenerateProDto,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      throw new BadRequestException('Hanya boleh upload gambar (jpg, jpeg, png, webp)');
    }
    const userId = req.user.userId;
    return this.generateProService.submitTask(dto, file, userId);
  }

  @Post('callback')
  async handleCallback(@Body() payload: KieCallbackPayload) {
    await this.generateProService.handleCallback(payload);
    return { received: true };
  }

  @Post('progress-callback')
  async handleProgressCallback(@Body() payload: any) {
    await this.generateProService.handleProgressCallback(payload);
    return { received: true };
  }

  @Get('active-job')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Active job retrieved')
  async getActiveJob(@Req() req: any) {
    const job = await this.galleryService.findActiveJob(req.user.userId);
    if (!job) return null;

    // Sync status dari Kie.ai jika masih processing
    try {
      const kieData = await this.generateProService.queryTaskStatus(job.jobId);
      // Jika sudah selesai di Kie.ai, syncJobStatus sudah dijalankan di queryTaskStatus
      if (kieData.state === 'success' || kieData.state === 'fail') {
        return null; // Job sudah selesai, tidak ada active job
      }
    } catch {
      // Jika query Kie.ai gagal, tetap return job yang ada
    }

    return {
      jobId: job.jobId,
      productName: job.productName,
      thumbnailUrl: job.thumbnailUrl,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  @Get('status/:taskId')
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Task status retrieved')
  async getTaskStatus(@Param('taskId') taskId: string) {
    return this.generateProService.queryTaskStatus(taskId);
  }
}
