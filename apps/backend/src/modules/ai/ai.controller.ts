import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post as HttpPost,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PageQueryDto } from '@/common/dto/page-query.dto';
import { Throttle } from '@/common/decorators/throttle.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CreateCopilotPlanDto } from './dto/create-copilot-plan.dto';

@ApiTags('AI Copilot')
@Controller('ai/copilot')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Throttle({ limit: 20, ttl: 60 * 5, keyPrefix: 'ai-plan' })
  @ApiOperation({ summary: '生成 AI 观测计划' })
  @HttpPost('plan')
  createPlan(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCopilotPlanDto,
  ) {
    return this.aiService.createPlan(user.id, dto);
  }

  @Throttle({ limit: 10, ttl: 60 * 5, keyPrefix: 'ai-stream' })
  @ApiOperation({ summary: '流式生成 AI 观测计划' })
  @HttpPost('plan/stream')
  async streamPlan(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCopilotPlanDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const write = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      (res as Response & { flush?: () => void }).flush?.();
    };

    try {
      await this.aiService.streamPlan(user.id, dto, { write });
    } catch (error) {
      write('error', {
        code: 500,
        data: null,
        msg: error instanceof Error ? error.message : 'stream failed',
      });
      write('done', { ok: false });
    } finally {
      res.end();
    }
  }

  @ApiOperation({ summary: '获取 AI 观测计划历史' })
  @Get('history')
  history(@CurrentUser() user: { id: string }, @Query() query: PageQueryDto) {
    return this.aiService.history(user.id, query.page, query.pageSize);
  }

  @ApiOperation({ summary: '删除 AI 观测计划历史记录' })
  @Delete('history/:id')
  removeHistory(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.aiService.removeHistory(user.id, id);
  }
}
