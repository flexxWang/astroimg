import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { configureApp } from './bootstrap';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { AppLogger } from './common/logging/app-logger.service';
import { initBackendSentry } from './common/monitoring/sentry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  initBackendSentry(configService);

  app.use(cookieParser());
  configureApp(app);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  const logger = app.get(AppLogger);
  logger.event('app.bootstrap.completed', {
    port,
    baseUrl: `http://localhost:${port}`,
  });
}

bootstrap();
