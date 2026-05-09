import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

function normalizeIp(value?: string) {
  if (!value) {
    return '';
  }

  return value.startsWith('::ffff:') ? value.slice('::ffff:'.length) : value;
}

@Injectable()
export class MetricsAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.configService.get<string>(
      'app.monitoring.metrics.token',
    );
    const allowedIps =
      this.configService.get<string[]>('app.monitoring.metrics.allowedIps') ??
      [];

    if (token && this.extractToken(request) === token) {
      return true;
    }

    const requestIp = normalizeIp(request.ip);
    const allowed = new Set(
      allowedIps.flatMap((item) => [item, normalizeIp(item)]),
    );
    if (requestIp && allowed.has(requestIp)) {
      return true;
    }

    throw new UnauthorizedException('Metrics endpoint is protected');
  }

  private extractToken(request: Request) {
    const headerToken = request.get('x-metrics-token');
    if (headerToken) {
      return headerToken;
    }

    const authorization = request.get('authorization');
    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' ? token : undefined;
  }
}
