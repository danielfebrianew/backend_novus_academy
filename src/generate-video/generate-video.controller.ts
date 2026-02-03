import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  InternalServerErrorException,
  Sse,
  MessageEvent,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GenerateAiService } from './generate-video.service';
import { GenerateTextDto, GenerateVideoDto } from './dto/generate-video.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { HistoryService } from 'src/history/history.service';
import { ActionType } from 'src/history/entities/history.entity';


@Controller('generate')
@UseInterceptors(ResponseInterceptor)
@UseGuards(AuthenticatedGuard)
export class GenerateAiController {
  constructor(
    private readonly generateAiService: GenerateAiService,
    private readonly historyService: HistoryService,
    private eventEmitter: EventEmitter2
  ) { }

  @SkipThrottle()
  @Sse('progress/:jobId')
  sse(@Param('jobId') jobId: string): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'job.progress').pipe(
      filter((payload: any) => payload.jobId === jobId),
      map((payload: any) => {
        return {
          data: {
            message: payload.message,
            progress: payload.progress ?? null
          },
        } as MessageEvent;
      }),
    );
  }

  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @Post('text')
  @ResponseMessage('Generate Text Berhasil')
  async generateText(@Body() dto: GenerateTextDto, @Req() req: any) {
    const result = await this.generateAiService.generateText(dto.imageUrl, dto.promptCount, dto.productName); const userId = req.session.user.id;
    await this.historyService.logActivity(
      userId,
      ActionType.GEN_TEXT,
      dto,    // Input (Prompt, ProductName)
      result  // Output (Voiceover, Caption, dll)
    );
    return result;
  }

  @Throttle({ heavy: { limit: 2, ttl: 60000 } })
  @Post('video')
  @ResponseMessage('Video sedang diproses')
  async generateVideo(@Body() dto: GenerateVideoDto, @Req() req: any) {
    const count = dto.prompts.length;
    const userId = req.session.user.id;

    if (![4, 5, 6].includes(count)) {
      throw new BadRequestException(`Jumlah prompt harus 4, 5, atau 6. Kamu kirim ${count}.`);
    }

    const result = await this.generateAiService.processVideoVariations(
      dto.images,
      dto.productName,
      dto.prompts,
      dto.script,
      dto.jobId,
      dto.targetCount,
      dto.voiceGender || 'female',
      userId  
    );

    const inputSummary = {
      jobId: dto.jobId,
      voiceGender: dto.voiceGender,
      targetCount: dto.targetCount,
      imageCount: dto.images.length,
      promptCount: dto.prompts.length,
      script: dto.script 
    };

    await this.historyService.logActivity(
        userId,
        ActionType.GEN_VIDEO,
        inputSummary,
        result 
      );

    return result;
  }

  @Throttle({ upload: { limit: 15, ttl: 60000 } })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 6))
  @ResponseMessage('Upload File Berhasil')
  async uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Req() req: any) {
    if (!files || files.length === 0) throw new BadRequestException('File tidak ditemukan');

    for (const file of files) {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        throw new BadRequestException('Hanya boleh upload file gambar (jpg, png, webp)');
      }
    }

    try {
      const result = await this.generateAiService.uploadImages(files);

      const userId = req.session.user.id;
      const inputSummary = {
        fileCount: files.length,
        fileNames: files.map(f => f.originalname)
      };

      await this.historyService.logActivity(
        userId,
        ActionType.UPLOAD,
        inputSummary,
        result // Isinya array S3 URLs
      );

      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload Failed';
      throw new InternalServerErrorException(msg);
    }
  }
}