import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkComment } from './work-comment.entity';
import { WorkCommentService } from './work-comment.service';
import { WorkCommentController } from './work-comment.controller';
import { Work } from '../work/work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkComment, Work])],
  providers: [WorkCommentService],
  controllers: [WorkCommentController],
})
export class WorkCommentModule {}
