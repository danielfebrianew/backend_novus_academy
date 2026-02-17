import {
  BadRequestException,
  Body,
  Controller,
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

@Controller('generate-pro')
@UseInterceptors(ResponseInterceptor)
export class GenerateProController {
  constructor(
    private readonly generateProService: GenerateProService,
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
  handleCallback(@Body() payload: KieCallbackPayload) {
    this.generateProService.handleCallback(payload);
    return { received: true };
  }
}
