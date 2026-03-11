import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { Post } from '../post/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Post])],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
