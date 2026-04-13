import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

type AllowedOrigin = string | RegExp;

function isOriginAllowed(origin: string, allowedOrigins: AllowedOrigin[]) {
  return allowedOrigins.some((item) =>
    item instanceof RegExp ? item.test(origin) : item === origin,
  );
}

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const trustProxy = configService.get<boolean>('app.trustProxy') ?? false;
  const allowedOrigins =
    configService.get<string[]>('app.corsAllowedOrigins') ?? [];

  try {
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  } catch {
    // Testing modules may omit the Winston provider.
  }
  app.enableShutdownHooks();

  if (trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

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
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });
}
