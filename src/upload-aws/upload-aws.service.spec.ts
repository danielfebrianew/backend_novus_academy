import { Test, TestingModule } from '@nestjs/testing';
import { UploadAwsService } from './upload-aws.service';

describe('UploadAwsService', () => {
  let service: UploadAwsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadAwsService],
    }).compile();

    service = module.get<UploadAwsService>(UploadAwsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
