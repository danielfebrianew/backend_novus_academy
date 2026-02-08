import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { AppLogger } from '../logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(AppLogger) private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    const startTime = Date.now();

    // Attach request ID to response header for tracing
    response.setHeader('x-request-id', requestId);

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = (request as any).user?.id || 'anonymous';

    this.logger.logWithMeta('info', `Incoming request: ${method} ${originalUrl}`, {
      context: 'HTTP',
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
      userId,
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.logWithMeta('info', `Response: ${method} ${originalUrl} ${response.statusCode}`, {
          context: 'HTTP',
          requestId,
          method,
          url: originalUrl,
          statusCode: response.statusCode,
          duration: `${duration}ms`,
          userId,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.logWithMeta('error', `Error: ${method} ${originalUrl} — ${error.message}`, {
          context: 'HTTP',
          requestId,
          method,
          url: originalUrl,
          statusCode: error.status || 500,
          duration: `${duration}ms`,
          userId,
          stack: error.stack,
        });
        throw error;
      }),
    );
  }
}
