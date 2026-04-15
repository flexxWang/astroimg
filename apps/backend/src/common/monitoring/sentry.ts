import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

let initialized = false;

export function initBackendSentry(configService: ConfigService) {
  if (initialized) {
    return true;
  }

  const enabled =
    configService.get<boolean>('app.monitoring.sentry.enabled') ?? false;
  const dsn = configService.get<string>('app.monitoring.sentry.dsn') ?? '';

  if (!enabled || dsn.length === 0) {
    return false;
  }

  Sentry.init({
    dsn,
    enabled,
    environment:
      configService.get<string>('app.monitoring.environment') ??
      process.env.NODE_ENV ??
      'development',
    release: configService.get<string | undefined>(
      'app.monitoring.sentry.release',
    ),
    tracesSampleRate:
      configService.get<number>('app.monitoring.sentry.tracesSampleRate') ?? 0,
    sendDefaultPii: false,
  });

  initialized = true;
  return true;
}

export function isBackendSentryEnabled() {
  return initialized;
}

export { Sentry };
