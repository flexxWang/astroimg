import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationPoint } from './observation.entity';
import { ObservationService } from './observation.service';
import { ObservationController } from './observation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ObservationPoint])],
  providers: [ObservationService],
  controllers: [ObservationController],
})
export class ObservationModule {}
