import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { Post } from '../post/post.entity';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../user/user.entity';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post, User]), NotificationModule],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
