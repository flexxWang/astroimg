import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { AppLogger } from '@/common/logging/app-logger.service';
import { RequestContextService } from '@/common/context/request-context.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [new transports.Console()],
    }),
  ],
  controllers: [MetricsController],
  providers: [RequestContextService, AppLogger, MetricsService],
  exports: [RequestContextService, AppLogger, MetricsService, WinstonModule],
})
export class ObservabilityModule {}
