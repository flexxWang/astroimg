import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { RequestWithContext } from '@/common/http/request.types';
import { MetricsService } from '@/common/observability/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: RequestWithContext, res: Response, next: NextFunction) {
    const startedAt = Date.now();

    res.on('finish', () => {
      const routePath =
        (req.route as { path?: string } | undefined)?.path ??
        req.originalUrl ??
        req.url ??
        req.path ??
        'unknown';
      const route = typeof routePath === 'string' ? routePath : 'unknown';
      this.metricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        Date.now() - startedAt,
      );
    });

    next();
  }
}
