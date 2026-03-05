import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { GenerateProModule } from '../src/generate-pro/generate-pro.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryModule } from 'src/gallery/gallery.module';
import { UsersModule } from 'src/users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { VideoJobStatus } from 'src/gallery/entities/video-job.entity';
import { GalleryService } from 'src/gallery/gallery.service';
import { UsersService } from 'src/users/users.service';

import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoJob } from 'src/gallery/entities/video-job.entity';
import { VideoResult } from 'src/gallery/entities/video-result.entity';
import { User } from 'src/users/entities/user.entity';

// Need a mocked DB setup to safely test e2e without touching production DB
// We will mock the required services directly since testing a full DB requires a test db setup
describe('GenerateProController (e2e)', () => {
    let app: INestApplication;
    let galleryService: jest.Mocked<GalleryService>;
    let usersService: jest.Mocked<UsersService>;

    beforeEach(async () => {
        galleryService = {
            findJobByJobId: jest.fn().mockResolvedValue({ userId: 1, status: VideoJobStatus.PROCESSING } as any),
            updateJobStatus: jest.fn().mockResolvedValue(undefined as any),
            upsertVideoToJob: jest.fn(),
            findActiveJob: jest.fn(),
            findAllJobs: jest.fn(),
        } as any;

        usersService = {
            addCredits: jest.fn().mockResolvedValue(120), // return updated balance
            deductCredits: jest.fn(),
            findByEmail: jest.fn(),
            findOne: jest.fn(),
            getCredits: jest.fn(),
        } as any;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                EventEmitterModule.forRoot(),
                GenerateProModule, // This module will still require its internal dependencies
            ],
        })
            .overrideProvider(GalleryService)
            .useValue(galleryService)
            .overrideProvider(UsersService)
            .useValue(usersService)
            .overrideProvider(getRepositoryToken(VideoJob))
            .useValue({})
            .overrideProvider(getRepositoryToken(VideoResult))
            .useValue({})
            .overrideProvider(getRepositoryToken(User))
            .useValue({})
            .overrideProvider('DataSource')
            .useValue({})
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/generate-pro/callback (POST) - fail scenario refunds credits', () => {
        const jobId = 'e2e-test-job-id';
        const payload = {
            code: 200,
            msg: 'success',
            data: {
                taskId: jobId,
                state: 'fail',
                model: 'sora-2',
                failMsg: 'Webhook simulated fail',
            }
        };

        return request(app.getHttpServer())
            .post('/generate-pro/callback')
            .send(payload)
            .expect(201) // NestJS POST default is 201
            .expect({ statusCode: 201, message: 'Success', data: { received: true } })
            .then(() => {
                expect(galleryService.updateJobStatus).toHaveBeenCalledWith(jobId, VideoJobStatus.FAILED, 'Webhook simulated fail');
                expect(usersService.addCredits).toHaveBeenCalledWith(1, 20); // User id 1, 20 credits
            });
    });
});
