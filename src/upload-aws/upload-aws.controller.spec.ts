import { Test, TestingModule } from '@nestjs/testing';
import { UploadAwsController } from './upload-aws.controller';

describe('UploadAwsController', () => {
  let controller: UploadAwsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadAwsController],
    }).compile();

    controller = module.get<UploadAwsController>(UploadAwsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
