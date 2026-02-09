import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isSse = this.reflector.get(SSE_METADATA, context.getHandler());
    if (isSse) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const message = this.reflector.get<string>('response_message', context.getHandler()) || 'Success';

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: message,
          data: data,
        };
      }),
    );
  }
}