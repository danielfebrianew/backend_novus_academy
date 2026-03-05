import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GenerateAiController } from './generate-video.controller';
import { GenerateAiService } from './generate-video.service';
import { VideoUtilsHelper } from './helpers/video-utils.helper';
import { AwsStorageService } from './services/aws-storage.service';
import { OpenAiScriptService } from './services/openai-script.service';
import { WavespeedVideoService } from './services/wavespeed-video.service';
import { GeminiTtsService } from './services/gemini-tts.service';
import { FalComposeService } from './services/fal-compose.service';
import { GalleryModule } from 'src/gallery/gallery.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [ConfigModule, GalleryModule, UsersModule],
  controllers: [GenerateAiController],
  providers: [
    GenerateAiService,
    VideoUtilsHelper,
    AwsStorageService,
    OpenAiScriptService,
    WavespeedVideoService,
    GeminiTtsService,
    FalComposeService,
  ],
})
export class GenerateAiModule {}
