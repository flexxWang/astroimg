import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FollowService } from './follow.service';
import { ToggleFollowDto } from './dto/toggle-follow.dto';
import { FollowStatusDto } from './dto/follow-status.dto';

@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post('toggle')
  toggle(@Body() dto: ToggleFollowDto, @CurrentUser() user: { id: string }) {
    return this.followService.toggle(user.id, dto.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  status(@Query() dto: FollowStatusDto, @CurrentUser() user: { id: string }) {
    return this.followService.status(user.id, dto.userId);
  }
}
