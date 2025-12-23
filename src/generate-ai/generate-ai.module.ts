import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GenerateAiController } from './generate-ai.controller';
import { GenerateAiService } from './generate-ai.service';
import { VideoUtilsHelper } from './helpers/video-utils.helper';
import { AwsStorageService } from './services/aws-storage.service';
import { OpenAiScriptService } from './services/openai-script.service';
import { WavespeedVideoService } from './services/wavespeed-video.service';
import { GeminiTtsService } from './services/gemini-tts.service';
import { FfmpegMixService } from './services/ffmpeg-mixer.service';
import { HistoryModule } from 'src/history/history.module';

@Module({
  imports: [ConfigModule, HistoryModule],
  controllers: [GenerateAiController],
  providers: [
    GenerateAiService,     
    VideoUtilsHelper,      
    AwsStorageService,
    OpenAiScriptService,
    WavespeedVideoService,
    GeminiTtsService,
    FfmpegMixService,
  ],
})
export class GenerateAiModule {}