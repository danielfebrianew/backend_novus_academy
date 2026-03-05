import { Module } from '@nestjs/common';
import { UploadAwsService } from './upload-aws.service';
import { UploadAwsController } from './upload-aws.controller';

@Module({
  providers: [UploadAwsService],
  controllers: [UploadAwsController],
  exports: [UploadAwsService]
})
export class UploadAwsModule {}
