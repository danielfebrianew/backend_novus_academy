import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements NestLoggerService {
  constructor(private readonly logger: winston.Logger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Log with arbitrary metadata (useful for structured logging).
   */
  logWithMeta(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    meta: Record<string, any>,
  ) {
    this.logger.log(level, message, meta);
  }
}
