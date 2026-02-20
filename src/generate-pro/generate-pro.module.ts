import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GalleryModule } from 'src/gallery/gallery.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { GenerateProController } from './generate-pro.controller';
import { GenerateProService } from './generate-pro.service';
import { AwsStorageService } from './services/aws-storage.service';
import { KieVideoService } from './services/kie-video.service';
import { OpenAiPromptService } from './services/gemini-prompt.service';

@Module({
  imports: [ConfigModule, GalleryModule, NotificationsModule],
  controllers: [GenerateProController],
  providers: [GenerateProService, KieVideoService, OpenAiPromptService, AwsStorageService],
})
export class GenerateProModule {}
