import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GalleryService } from './gallery.service';
import { VideoJob } from './entities/video-job.entity';
import { VideoResult } from './entities/video-result.entity';
import { NotFoundException } from '@nestjs/common';

describe('GalleryService', () => {
  let service: GalleryService;
  let jobRepo: any;
  let resultRepo: any;

  const mockJobRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockResultRepo = {
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn().mockImplementation((entity, data) => data),
        save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'uuid-123', ...data })),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
        { provide: getRepositoryToken(VideoJob), useValue: mockJobRepo },
        { provide: getRepositoryToken(VideoResult), useValue: mockResultRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<GalleryService>(GalleryService);
    jobRepo = module.get(getRepositoryToken(VideoJob));
    resultRepo = module.get(getRepositoryToken(VideoResult));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllJobs', () => {
    it('should return paginated jobs', async () => {
      const mockJobs = [{ id: '1', jobId: 'JOB_1', targetCount: 4 }];
      jobRepo.findAndCount.mockResolvedValue([mockJobs, 1]);

      const result = await service.findAllJobs(1, 1, 30);
      expect(result.jobs).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findJobDetail', () => {
    it('should throw NotFoundException if job does not exist', async () => {
      jobRepo.findOne.mockResolvedValue(null);
      await expect(service.findJobDetail('invalid', 1)).rejects.toThrow(NotFoundException);
    });

    it('should return job detail if found', async () => {
      const mockJob = { jobId: 'JOB_1', userId: 1, videos: [] };
      jobRepo.findOne.mockResolvedValue(mockJob);
      const result = await service.findJobDetail('JOB_1', 1);
      expect(result.jobId).toBe('JOB_1');
    });
  });
});