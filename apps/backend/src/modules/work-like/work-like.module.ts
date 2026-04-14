import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkLike } from './work-like.entity';
import { WorkLikeService } from './work-like.service';
import { WorkLikeController } from './work-like.controller';
import { WorkModule } from '../work/work.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkLike]), WorkModule],
  providers: [WorkLikeService],
  controllers: [WorkLikeController],
})
export class WorkLikeModule {}
