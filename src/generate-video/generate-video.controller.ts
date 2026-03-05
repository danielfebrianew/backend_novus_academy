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
import { UsersService } from 'src/users/users.service';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';


@Controller('generate')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
export class GenerateAiController {
  constructor(
    private readonly generateAiService: GenerateAiService,
    private readonly usersService: UsersService,
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
    const result = await this.generateAiService.generateText(dto.imageUrl, dto.promptCount, dto.productName, dto.productDescription);
    return result;
  }

  @Throttle({ heavy: { limit: 2, ttl: 60000 } })
  @Post('video')
  @ResponseMessage('Video sedang diproses')
  async generateVideo(@Body() dto: GenerateVideoDto, @Req() req: any) {
    const count = dto.prompts.length;
    const userId = req.user.userId;

    if (count < 4 || count > 6) {
      throw new BadRequestException(`Jumlah prompt harus antara 4-6. Kamu kirim ${count}.`);
    }

    if (dto.targetCount < 1 || dto.targetCount > 100) {
      throw new BadRequestException(`Jumlah variasi video harus antara 1-100. Kamu minta: ${dto.targetCount}`);
    }

    await this.usersService.deductCredits(userId, dto.targetCount);

    try {
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

      return result;
    } catch (error) {
      // Refund credits
      await this.usersService.addCredits(userId, dto.targetCount);
      throw error;
    }
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
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload Failed';
      throw new InternalServerErrorException(msg);
    }
  }
}