import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import type { Express } from 'express';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { buildCorsOriginValidator } from './common/http/origin-allowlist';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const trustProxy = configService.get<boolean>('app.trustProxy') ?? false;
  const allowedOrigins =
    configService.get<string[]>('app.corsAllowedOrigins') ?? [];
  const isProduction = configService.get<boolean>('app.isProduction') ?? false;

  try {
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  } catch {
    // Testing modules may omit the Winston provider.
  }
  app.enableShutdownHooks();

  if (trustProxy) {
    const httpAdapter = app.getHttpAdapter().getInstance() as Express;
    httpAdapter.set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'none'"],
              baseUri: ["'none'"],
              formAction: ["'none'"],
              frameAncestors: ["'none'"],
              imgSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              scriptSrc: ["'none'"],
              styleSrc: ["'none'"],
            },
          }
        : false,
      hsts: isProduction
        ? {
            maxAge: 31_536_000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.useGlobalInterceptors(app.get(ResponseInterceptor));

  app.enableCors({
    origin: buildCorsOriginValidator(allowedOrigins),
    credentials: true,
  });
}
