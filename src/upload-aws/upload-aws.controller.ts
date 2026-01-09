import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadAwsService } from './upload-aws.service';

@Controller('upload-aws')
export class UploadAwsController {
  constructor(private readonly uploadAwsService: UploadAwsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadAwsService.uploadFile(file);
  }
}
