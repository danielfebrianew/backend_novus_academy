import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VideoJob } from './entities/video-job.entity';
import { VideoResult } from './entities/video-result.entity';
import { CreateVideoJobDto } from './dto/create-video-job.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(VideoJob)
    private videoJobRepository: Repository<VideoJob>,
    @InjectRepository(VideoResult)
    private videoResultRepository: Repository<VideoResult>,
    private dataSource: DataSource,
  ) {}

  async createJobWithVideos(dto: CreateVideoJobDto): Promise<VideoJob> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const videoJob = queryRunner.manager.create(VideoJob, {
        userId: dto.userId,
        jobId: dto.jobId,
        productName: dto.productName,
        script: dto.script,
        voiceGender: dto.voiceGender,
        promptCount: dto.promptCount,
        targetCount: dto.targetCount,
        prompts: dto.prompts,
        inputImages: dto.inputImages,
        thumbnailUrl: dto.thumbnailUrl,
      });

      const savedJob = await queryRunner.manager.save(videoJob);

      const videoResults = dto.videos.map((v) =>
        queryRunner.manager.create(VideoResult, {
          ...v,
          videoJobId: savedJob.id,
        }),
      );

      await queryRunner.manager.save(videoResults);
      await queryRunner.commitTransaction();
      
      return savedJob;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to save video gallery data');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllJobs(userId: number, page: number = 1, limit: number = 30) {
    const [jobs, total] = await this.videoJobRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        jobId: job.jobId,
        productName: job.productName,
        thumbnailUrl: job.thumbnailUrl,
        videoCount: job.targetCount,
        voiceGender: job.voiceGender,
        createdAt: new Date(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findJobDetail(jobId: string, userId: number) {
    const job = await this.videoJobRepository.findOne({
      where: { jobId, userId },
      relations: ['videos'],
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async deleteJob(jobId: string, userId: number) {
    const job = await this.videoJobRepository.findOne({ where: { jobId, userId } });
    if (!job) throw new NotFoundException('Job not found');

    // TODO: Implement S3 deletion here in Phase 2
    // await this.awsStorageService.deleteFolder(`results/${jobId}`);

    await this.videoJobRepository.remove(job);
    return { deletedJobId: jobId };
  }

  async deleteSingleVideo(videoId: string) {
    const video = await this.videoResultRepository.findOne({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    // TODO: Implement S3 deletion here in Phase 2
    // await this.awsStorageService.deleteFile(video.videoUrl);

    await this.videoResultRepository.remove(video);
    return { deletedVideoId: videoId };
  }
}