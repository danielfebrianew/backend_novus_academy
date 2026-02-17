import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GenerateProController } from './generate-pro.controller';
import { GenerateProService } from './generate-pro.service';
import { AwsStorageService } from './services/aws-storage.service';
import { KieVideoService } from './services/kie-video.service';
import { OpenAiPromptService } from './services/openai-prompt.service';

@Module({
  imports: [ConfigModule],
  controllers: [GenerateProController],
  providers: [GenerateProService, KieVideoService, OpenAiPromptService, AwsStorageService],
})
export class GenerateProModule {}
