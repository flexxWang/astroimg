import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@/common/decorators/throttle.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('Observability')
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @SkipThrottle()
  @ApiOperation({ summary: '导出 Prometheus 文本格式指标' })
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics() {
    return this.metricsService.renderPrometheus();
  }
}
