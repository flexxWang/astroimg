import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { AppLogger } from '@/common/logging/app-logger.service';
import { RequestContextService } from '@/common/context/request-context.service';

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
  providers: [RequestContextService, AppLogger],
  exports: [RequestContextService, AppLogger, WinstonModule],
})
export class ObservabilityModule {}
