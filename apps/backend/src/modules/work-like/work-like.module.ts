import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkLike } from './work-like.entity';
import { WorkLikeService } from './work-like.service';
import { WorkLikeController } from './work-like.controller';
import { Work } from '../work/work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkLike, Work])],
  providers: [WorkLikeService],
  controllers: [WorkLikeController],
})
export class WorkLikeModule {}
