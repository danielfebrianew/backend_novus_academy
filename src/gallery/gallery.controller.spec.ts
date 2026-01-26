import { Test, TestingModule } from '@nestjs/testing';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

describe('GalleryController', () => {
  let controller: GalleryController;
  let service: GalleryService;

  const mockGalleryService = {
    findAllJobs: jest.fn(),
    findJobDetail: jest.fn(),
    deleteJob: jest.fn(),
    deleteSingleVideo: jest.fn(),
  };

  const mockRequest = {
    session: {
      user: { id: 1 }
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [
        { provide: GalleryService, useValue: mockGalleryService },
      ],
    }).compile();

    controller = module.get<GalleryController>(GalleryController);
    service = module.get<GalleryService>(GalleryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJobs', () => {
    it('should call service.findAllJobs with correct params', async () => {
      await controller.getJobs(1, 10, mockRequest);
      expect(service.findAllJobs).toHaveBeenCalledWith(1, 1, 10);
    });

    it('should use default pagination values', async () => {
      await controller.getJobs(undefined, undefined, mockRequest);
      expect(service.findAllJobs).toHaveBeenCalledWith(1, 1, 30);
    });
  });

  describe('getJobDetail', () => {
    it('should call service.findJobDetail', async () => {
      const jobId = 'JOB_123';
      await controller.getJobDetail(jobId, mockRequest);
      expect(service.findJobDetail).toHaveBeenCalledWith(jobId, 1);
    });
  });

  describe('deleteJob', () => {
    it('should call service.deleteJob', async () => {
      const jobId = 'JOB_123';
      await controller.deleteJob(jobId, mockRequest);
      expect(service.deleteJob).toHaveBeenCalledWith(jobId, 1);
    });
  });
});