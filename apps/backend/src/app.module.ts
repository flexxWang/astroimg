import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import { transports, format } from 'winston';
import { redisStore } from 'cache-manager-redis-yet';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import { AppController } from './app.controller';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [databaseConfig, redisConfig, jwtConfig],
    }),
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [new transports.Console()],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redis = configService.getOrThrow<{
          host: string;
          port: number;
          password?: string;
          db: number;
        }>('redis');
        const options: any = {
          socket: { host: redis.host, port: redis.port },
          database: redis.db,
        };
        if (redis.password) {
          options.password = redis.password;
        }
        return {
          store: await redisStore(options),
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
  ],
  controllers: [AppController],
})
export class AppModule {}
