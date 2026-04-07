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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { CreateCopilotPlanDto } from './dto/create-copilot-plan.dto';

@Controller('ai/copilot')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @HttpPost('plan')
  createPlan(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCopilotPlanDto,
  ) {
    return this.aiService.createPlan(user.id, dto);
  }

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
        message: error instanceof Error ? error.message : 'stream failed',
      });
      write('done', { ok: false });
    } finally {
      res.end();
    }
  }

  @Get('history')
  history(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.aiService.history(user.id, Number(page), Number(pageSize));
  }

  @Delete('history/:id')
  removeHistory(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.aiService.removeHistory(user.id, id);
  }
}
