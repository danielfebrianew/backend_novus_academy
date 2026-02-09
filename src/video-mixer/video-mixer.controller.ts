import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  GoneException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoMixerService } from './video-mixer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class VideoMixerController {
  constructor(private readonly videoService: VideoMixerService) {}

  @Post('video-mixer')
  @ResponseMessage('Endpoint deprecated')
  async stitchVideo() {
    throw new GoneException(
      'This endpoint is deprecated. Use POST /api/v1/video-mixer/upload to upload pre-mixed videos.',
    );
  }

  @Post('video-mixer/upload')
  @ResponseMessage('Video uploaded successfully')
  @Throttle({ upload: { limit: 15, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadMixedVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobId') jobId: string,
    @Body('variationIndex') variationIndex: string,
    @Body('productName') productName: string,
    @Body('script') script: string,
    @Body('voiceGender') voiceGender: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Only video files are allowed');
    }
    if (!jobId) {
      throw new BadRequestException('jobId is required');
    }

    const userId = req.user.userId;
    const index = parseInt(variationIndex) || 1;

    const result = await this.videoService.uploadProcessedVideo(
      file.buffer,
      file.mimetype,
      userId,
      jobId,
      index,
      productName || 'Mixed Video',
      script || '',
      voiceGender || 'female',
    );

    return result;
  }
}
