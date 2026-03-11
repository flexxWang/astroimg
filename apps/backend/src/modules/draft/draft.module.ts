import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Draft } from './draft.entity';
import { DraftController } from './draft.controller';
import { DraftService } from './draft.service';
import { Post } from '../post/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Draft, Post])],
  controllers: [DraftController],
  providers: [DraftService],
})
export class DraftModule {}
