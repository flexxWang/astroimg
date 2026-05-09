import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { FollowService } from './follow.service';
import { ToggleFollowDto } from './dto/toggle-follow.dto';
import { FollowStatusDto } from './dto/follow-status.dto';

@ApiTags('Follows')
@Controller('follows')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '切换关注状态' })
  @Post('toggle')
  toggle(@Body() dto: ToggleFollowDto, @CurrentUser() user: { id: string }) {
    return this.followService.toggle(user.id, dto.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '查询当前用户是否已关注目标用户' })
  @Get('status')
  status(@Query() dto: FollowStatusDto, @CurrentUser() user: { id: string }) {
    return this.followService.status(user.id, dto.userId);
  }
}
