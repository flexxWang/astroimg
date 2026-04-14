import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [UploadModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
