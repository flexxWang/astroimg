import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './comment.entity';
import { NotificationModule } from '../notification/notification.module';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PostModule } from '../post/post.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    NotificationModule,
    PostModule,
    UserModule,
  ],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
