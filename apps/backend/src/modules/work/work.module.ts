import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from './work.entity';
import { WorkType } from './work-type.entity';
import { WorkDevice } from './work-device.entity';
import { WorkService } from './work.service';
import { WorkController } from './work.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Work, WorkType, WorkDevice])],
  providers: [WorkService],
  controllers: [WorkController],
})
export class WorkModule {}
