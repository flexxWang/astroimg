import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';

@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: '获取当前用户通知列表' })
  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notificationService.list(user.id);
  }

  @ApiOperation({ summary: '获取当前用户未读通知数量' })
  @Get('unread-count')
  unreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationService.unreadCount(user.id);
  }

  @ApiOperation({ summary: '标记单条通知为已读' })
  @Post('read')
  markRead(@Body() dto: MarkReadDto, @CurrentUser() user: { id: string }) {
    return this.notificationService.markRead(user.id, dto.id);
  }

  @ApiOperation({ summary: '标记当前用户所有通知为已读' })
  @Post('read-all')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationService.markAllRead(user.id);
  }
}
