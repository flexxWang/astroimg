import { Controller, Get, Header } from '@nestjs/common';
import { SkipThrottle } from '@/common/decorators/throttle.decorator';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @SkipThrottle()
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics() {
    return this.metricsService.renderPrometheus();
  }
}
