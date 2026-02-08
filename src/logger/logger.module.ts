import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { AppLogger } from './logger.service';
import { createWinstonConfig } from './winston.config';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

const WINSTON_LOGGER = 'WINSTON_LOGGER';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WINSTON_LOGGER,
      useFactory: (configService: ConfigService) => {
        return winston.createLogger(createWinstonConfig(configService));
      },
      inject: [ConfigService],
    },
    {
      provide: AppLogger,
      useFactory: (winstonLogger: winston.Logger) => {
        return new AppLogger(winstonLogger);
      },
      inject: [WINSTON_LOGGER],
    },
    LoggingInterceptor,
  ],
  exports: [AppLogger, LoggingInterceptor],
})
export class LoggerModule {}
