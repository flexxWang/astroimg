import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { Post } from '../post/post.entity';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Post, User]), NotificationModule],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
