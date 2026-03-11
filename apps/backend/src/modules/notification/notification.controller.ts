import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationController {
  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return [];
  }
}
