import {
  Controller,
  Get,
  Param,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkLikeService } from './work-like.service';

@ApiTags('Work Likes')
@Controller('works/:workId/likes')
export class WorkLikeController {
  constructor(private readonly likeService: WorkLikeService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '切换作品点赞状态' })
  @HttpPost('toggle')
  toggle(@Param('workId') workId: string, @CurrentUser() user: { id: string }) {
    return this.likeService.toggle(workId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '查询当前用户是否已点赞作品' })
  @Get('me')
  isLiked(
    @Param('workId') workId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.likeService.isLiked(workId, user.id);
  }
}
