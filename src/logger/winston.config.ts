import * as winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { ConfigService } from '@nestjs/config';

export const createWinstonConfig = (
  configService: ConfigService,
): winston.LoggerOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const betterStackToken = configService.get<string>('BETTERSTACK_SOURCE_TOKEN');

  const transports: winston.transport[] = [];

  // Console transport — dev only
  if (!isProduction) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const ctx = context ? `[${context}]` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
          }),
        ),
      }),
    );
  }

  // Better Stack transport — both dev & prod
  if (betterStackToken) {
    const logtail = new Logtail(betterStackToken, {
      endpoint: 'https://s1723977.eu-fsn-3.betterstackdata.com',
    });

    transports.push(new LogtailTransport(logtail));
  }

  // Fallback: if no transports configured, add console so logs aren't lost
  if (transports.length === 0) {
    transports.push(new winston.transports.Console());
  }

  return {
    level: isProduction ? 'info' : 'debug',
    defaultMeta: {
      service: 'novus-academy-backend',
      environment: configService.get('NODE_ENV') || 'development',
    },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports,
    exceptionHandlers: transports,
    rejectionHandlers: transports,
  };
};
