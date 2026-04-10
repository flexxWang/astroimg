import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { MarkReadDto } from './dto/mark-read.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.notificationService.list(user.id);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationService.unreadCount(user.id);
  }

  @Post('read')
  markRead(@Body() dto: MarkReadDto, @CurrentUser() user: { id: string }) {
    return this.notificationService.markRead(user.id, dto.id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationService.markAllRead(user.id);
  }
}
