import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@/common/decorators/throttle.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Get('health')
  async health() {
    const status = await this.appService.ready();
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
    return this.appService.live();
  }

  @SkipThrottle()
  @Get('health/ready')
  async ready() {
    const status = await this.appService.ready();
    if (status.status !== 'ok') {
      throw new ServiceUnavailableException({
        message: 'Service dependencies are not ready',
        details: status.dependencies,
      });
    }
    return status;
  }
}
