import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@/common/decorators/throttle.decorator';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @SkipThrottle()
  @Get('health')
  async health() {
    const status = await this.healthService.ready();
    if (status.status !== 'ok') {
      throw new ServiceUnavailableException({
        message: 'Service dependencies are not ready',
        details: status.dependencies,
      });
    }
    return status;
  }

  @SkipThrottle()
  @Get('health/live')
  live() {
    return this.healthService.live();
  }

  @SkipThrottle()
  @Get('health/ready')
  async ready() {
    const status = await this.healthService.ready();
    if (status.status !== 'ok') {
      throw new ServiceUnavailableException({
        message: 'Service dependencies are not ready',
        details: status.dependencies,
      });
    }
    return status;
  }
}
