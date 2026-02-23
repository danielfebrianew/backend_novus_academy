import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerateAiModule } from './generate-video/generate-video.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { VideoMixerModule } from './video-mixer/video-mixer.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { HistoryModule } from './history/history.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AccountsModule } from './accounts/accounts.module';
import { ReportsModule } from './reports/reports.module';
import { UploadAwsModule } from './upload-aws/upload-aws.module';
import { GalleryModule } from './gallery/gallery.module';
import { GenerateImageModule } from './generate-image/generate-image.module';
import { LoggerModule } from './logger/logger.module';
import { LoggingInterceptor } from './logger/interceptors/logging.interceptor';
import { GenerateProModule } from './generate-pro/generate-pro.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') || 'redis://localhost:6379';

        const isTls = redisUrl.startsWith('rediss://');

        return {
          throttlers: [
            {
              name: 'default',
              ttl: 1000,    // 1 detik
              limit: 20,    // 20 request
            },
          ],
          storage: new ThrottlerStorageRedisService(
            new Redis(redisUrl, {
              family: 4,
              tls: isTls ? { rejectUnauthorized: false } : undefined,
            })
          ),
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'mysql',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT') || 3306,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          timezone: 'Z',
          autoLoadEntities: true,
          synchronize: true,
          migrationsRun: false,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          logging: !isProduction,
          extra: {
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true, 
            keepAliveInitialDelay: 10000
          }
        };
      },
    }),
    EventEmitterModule.forRoot(),
    GenerateAiModule,
    GenerateImageModule,
    UsersModule,
    AuthModule,
    VideoMixerModule,
    HistoryModule,
    SchedulerModule,
    AccountsModule,
    ReportsModule,
    UploadAwsModule,
    GalleryModule,
    GenerateProModule,

  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }