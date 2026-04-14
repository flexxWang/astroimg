import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppLogger } from '@/common/logging/app-logger.service';
import { RequestContextService } from '@/common/context/request-context.service';

type RequestWithContext = Request & {
  requestId?: string;
  traceId?: string;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    const requestId =
      typeof req.headers['x-request-id'] === 'string' &&
      req.headers['x-request-id'].trim().length > 0
        ? req.headers['x-request-id'].trim()
        : randomUUID();
    const traceId =
      typeof req.headers['x-trace-id'] === 'string' &&
      req.headers['x-trace-id'].trim().length > 0
        ? req.headers['x-trace-id'].trim()
        : requestId;

    req.requestId = requestId;
    req.traceId = traceId;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Trace-Id', traceId);

    this.requestContext.run(
      {
        requestId,
        traceId,
        method: req.method,
        path: req.originalUrl || req.url,
      },
      () => {
        res.on('finish', () => {
          this.logger.event('http.request.completed', {
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            ip: req.ip,
            userAgent: req.get('user-agent'),
          });
        });

        next();
      },
    );
  }
}
