import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { RequestWithContext } from '@/common/http/request.types';
import type { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();
        const request = context.switchToHttp().getRequest<RequestWithContext>();
        const statusCode = response?.statusCode ?? 200;

        return {
          code: statusCode,
          data,
          msg: 'ok',
          requestId: request?.requestId,
          traceId: request?.traceId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
