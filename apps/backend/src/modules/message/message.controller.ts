import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('messages')
export class MessageController {
  @UseGuards(JwtAuthGuard)
  @Get('inbox')
  inbox() {
    return [];
  }
}
