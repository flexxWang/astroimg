import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkComment } from './work-comment.entity';
import { WorkCommentService } from './work-comment.service';
import { WorkCommentController } from './work-comment.controller';
import { WorkModule } from '../work/work.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkComment]), WorkModule],
  providers: [WorkCommentService],
  controllers: [WorkCommentController],
})
export class WorkCommentModule {}
