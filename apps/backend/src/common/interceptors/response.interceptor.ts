import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();
        const statusCode = response?.statusCode ?? 200;

        return {
          code: statusCode,
          data,
          msg: 'ok',
          requestId: request?.requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
