import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@/common/decorators/throttle.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @SkipThrottle()
  @ApiOperation({ summary: '综合健康检查，依赖异常时返回 503' })
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
  @ApiOperation({ summary: '存活检查，不检查外部依赖' })
  @Get('health/live')
  live() {
    return this.healthService.live();
  }

  @SkipThrottle()
  @ApiOperation({ summary: '就绪检查，检查数据库、缓存和对象存储' })
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
