import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { LikeService } from './like.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { LikeStatusDto } from './dto/like-status.dto';

@ApiTags('Post Likes')
@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '切换帖子点赞状态' })
  @Post('toggle')
  toggle(@Body() dto: ToggleLikeDto, @CurrentUser() user: { id: string }) {
    return this.likeService.toggle(user.id, dto.postId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '查询当前用户是否已点赞帖子' })
  @Get('status')
  status(@Query() dto: LikeStatusDto, @CurrentUser() user: { id: string }) {
    return this.likeService.status(user.id, dto.postId);
  }
}
