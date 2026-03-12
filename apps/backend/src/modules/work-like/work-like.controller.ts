import { Controller, Get, Param, Post as HttpPost, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkLikeService } from './work-like.service';

@Controller('works/:workId/likes')
export class WorkLikeController {
  constructor(private readonly likeService: WorkLikeService) {}

  @UseGuards(JwtAuthGuard)
  @HttpPost('toggle')
  toggle(
    @Param('workId') workId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.likeService.toggle(workId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  isLiked(
    @Param('workId') workId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.likeService.isLiked(workId, user.id);
  }
}
