import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiPlanSession } from './ai-plan-session.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ObservationPoint } from '../observation/observation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiPlanSession, ObservationPoint])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
