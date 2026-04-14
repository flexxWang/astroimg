import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { NotificationModule } from '../notification/notification.module';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like]),
    NotificationModule,
    PostModule,
    UserModule,
  ],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
