import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RequestContextService } from '@/common/context/request-context.service';

type LogMeta = Record<string, unknown>;

@Injectable()
export class AppLogger {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly requestContext: RequestContextService,
  ) {}

  log(message: string, meta?: LogMeta) {
    this.logger.log(this.serialize('info', message, meta));
  }

  warn(message: string, meta?: LogMeta) {
    this.logger.warn(this.serialize('warn', message, meta));
  }

  error(message: string, error?: unknown, meta?: LogMeta) {
    const payload = this.serialize('error', message, {
      ...meta,
      stack: error instanceof Error ? error.stack : undefined,
      errorMessage: error instanceof Error ? error.message : undefined,
    });
    this.logger.error(payload);
  }

  event(event: string, meta?: LogMeta) {
    this.logger.log(this.serialize('event', event, meta));
  }

  asLoggerService(): LoggerService {
    return this.logger;
  }

  private serialize(level: string, message: string, meta?: LogMeta) {
    const context = this.requestContext.get();

    return JSON.stringify({
      level,
      message,
      service:
        this.configService.get<string>('app.monitoring.serviceName') ??
        'astroimg-backend',
      environment:
        this.configService.get<string>('app.monitoring.environment') ??
        process.env.NODE_ENV ??
        'development',
      requestId: context?.requestId,
      traceId: context?.traceId,
      method: context?.method,
      path: context?.path,
      userId: context?.userId,
      ...meta,
    });
  }
}
