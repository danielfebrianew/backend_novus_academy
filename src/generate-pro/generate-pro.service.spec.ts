import { Test, TestingModule } from '@nestjs/testing';
import { GenerateProService } from './generate-pro.service';
import { KieVideoService } from './services/kie-video.service';
import { GeminiVideoPromptService } from './services/gemini-prompt.service';
import { AwsStorageService } from './services/aws-storage.service';
import { GalleryService } from '../../src/gallery/gallery.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '../../src/users/users.service';
import { VideoJobStatus } from '../../src/gallery/entities/video-job.entity';

describe('GenerateProService', () => {
    let service: GenerateProService;
    let kieVideoService: jest.Mocked<KieVideoService>;
    let usersService: jest.Mocked<UsersService>;
    let galleryService: jest.Mocked<GalleryService>;
    let eventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(async () => {
        // Creating Mock Providers
        kieVideoService = {
            createTask: jest.fn(),
            queryTask: jest.fn(),
        } as any;

        usersService = {
            addCredits: jest.fn(),
            deductCredits: jest.fn(),
        } as any;

        galleryService = {
            createJobMetadata: jest.fn(),
            updateJobStatus: jest.fn(),
            findJobByJobId: jest.fn(),
            upsertVideoToJob: jest.fn(),
        } as any;

        eventEmitter = {
            emit: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GenerateProService,
                { provide: KieVideoService, useValue: kieVideoService },
                { provide: GeminiVideoPromptService, useValue: {} },
                { provide: AwsStorageService, useValue: {} },
                { provide: GalleryService, useValue: galleryService },
                { provide: ConfigService, useValue: { get: jest.fn() } },
                { provide: EventEmitter2, useValue: eventEmitter },
                { provide: UsersService, useValue: usersService },
            ],
        }).compile();

        service = module.get<GenerateProService>(GenerateProService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Refund handling in handleCallback', () => {
        it('should refund 20 credits if callback state is fail', async () => {
            const jobId = 'test-job-id';
            const userId = 123;

            galleryService.findJobByJobId.mockResolvedValue({ userId } as any);

            // Simulate webhook failure
            await service.handleCallback({
                data: {
                    taskId: jobId,
                    state: 'fail',
                    failMsg: 'Simulated failure',
                }
            } as any);

            expect(galleryService.updateJobStatus).toHaveBeenCalledWith(jobId, VideoJobStatus.FAILED, 'Simulated failure');
            expect(usersService.addCredits).toHaveBeenCalledWith(userId, 20);
        });
    });

    describe('Refund handling in syncJobStatus', () => {
        it('should refund 20 credits if state is fail', async () => {
            const jobId = 'test-job-id';
            const userId = 123;

            galleryService.findJobByJobId.mockResolvedValue({
                userId,
                status: VideoJobStatus.PROCESSING
            } as any);

            // Simulate status check showing failure
            await service.syncJobStatus(jobId, 'fail', [], 'Simulated failure');

            expect(usersService.addCredits).toHaveBeenCalledWith(userId, 20);
            expect(galleryService.updateJobStatus).toHaveBeenCalledWith(jobId, VideoJobStatus.FAILED, 'Simulated failure');
        });
    });
});
