import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { APP_GUARD } from '@nestjs/core';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/post/post.module';
import { CommentModule } from './modules/comment/comment.module';
import { LikeModule } from './modules/like/like.module';
import { FollowModule } from './modules/follow/follow.module';
import { MessageModule } from './modules/message/message.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UploadModule } from './modules/upload/upload.module';
import { DraftModule } from './modules/draft/draft.module';
import { WorkModule } from './modules/work/work.module';
import { WorkCommentModule } from './modules/work-comment/work-comment.module';
import { WorkLikeModule } from './modules/work-like/work-like.module';
import { ObservationModule } from './modules/observation/observation.module';
import { AiModule } from './modules/ai/ai.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { ThrottleGuard } from './common/guards/throttle.guard';
import { MetricsAuthGuard } from './common/guards/metrics-auth.guard';
import { getBackendEnvFilePaths } from './config/env-files';
import { ObservabilityModule } from './common/observability/observability.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getBackendEnvFilePaths(),
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      validate: validateEnv,
    }),
    ObservabilityModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redis = configService.getOrThrow<{
          host: string;
          port: number;
          password?: string;
          db: number;
        }>('redis');
        const options: {
          socket: { host: string; port: number };
          database: number;
          password?: string;
        } = {
          socket: { host: redis.host, port: redis.port },
          database: redis.db,
        };
        if (redis.password) {
          options.password = redis.password;
        }
        return {
          stores: [
            createKeyv(options, {
              namespace: undefined,
            }),
          ],
        };
      },
    }),
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    LikeModule,
    FollowModule,
    MessageModule,
    NotificationModule,
    UploadModule,
    DraftModule,
    WorkModule,
    WorkCommentModule,
    WorkLikeModule,
    ObservationModule,
    AiModule,
    HealthModule,
  ],
  providers: [
    HttpExceptionFilter,
    ResponseInterceptor,
    MetricsAuthGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(CsrfMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(MetricsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
