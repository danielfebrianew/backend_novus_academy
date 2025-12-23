import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerateAiModule } from './generate-ai/generate-ai.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { VideoMixerModule } from './video-mixer/video-mixer.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { HistoryModule } from './history/history.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 detik
            limit: 3,  // Maks 3 request per detik 
          },
          {
            name: 'medium',
            ttl: 10000, // 10 detik
            limit: 20,
          },
          {
            name: 'heavy',
            ttl: 60000, // 1 menit
            limit: 3,
          },
          {
            name: 'auth', // <--- INI KHUSUS LOGIN
            ttl: 60000, // 60 detik (1 menit)
            limit: 5,   // Maks 5 kali coba login per menit
          },
          {
            name: 'upload',
            ttl: 60000,
            limit: 5, // Maks 5 kali upload per menit
          }
        ],
        storage: new ThrottlerStorageRedisService({
          host: config.get<string>('REDIS_HOST'),
          port: parseInt(config.get<string>('REDIS_PORT') || '6379'),
          password: config.get<string>('REDIS_PASSWORD'),
        }),
      }),
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
          autoLoadEntities: true,
          // --- THE SWITCH ---
          synchronize: !isProduction,
          logging: !isProduction,
          // Opsi tambahan: SSL (Biasanya Prod butuh SSL kalau database beda server)
          // ssl: isProduction ? { rejectUnauthorized: false } : null, 
        };
      },
    }),
    EventEmitterModule.forRoot(),
    GenerateAiModule,
    UsersModule,
    AuthModule,
    VideoMixerModule,
    HistoryModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }