import { registerAs } from '@nestjs/config';

function parseOrigins(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const secureCookies =
    process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production';
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase() as
    | 'lax'
    | 'strict'
    | 'none';

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    trustProxy,
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      serviceName: process.env.MONITORING_SERVICE_NAME || 'astroimg-backend',
      environment: process.env.MONITORING_ENVIRONMENT || nodeEnv,
      sentry: {
        enabled:
          process.env.SENTRY_ENABLED === 'true' &&
          Boolean(process.env.SENTRY_DSN?.trim()),
        dsn: process.env.SENTRY_DSN || '',
        release: process.env.SENTRY_RELEASE || undefined,
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),
      },
    },
    corsAllowedOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
    cookie: {
      domain: process.env.COOKIE_DOMAIN || undefined,
      secure: secureCookies,
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    healthcheckTimeoutMs: 1_500,
  };
});
