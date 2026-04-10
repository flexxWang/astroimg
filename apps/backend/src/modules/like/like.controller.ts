import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { LikeService } from './like.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { LikeStatusDto } from './dto/like-status.dto';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('toggle')
  toggle(@Body() dto: ToggleLikeDto, @CurrentUser() user: { id: string }) {
    return this.likeService.toggle(user.id, dto.postId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  status(@Query() dto: LikeStatusDto, @CurrentUser() user: { id: string }) {
    return this.likeService.status(user.id, dto.postId);
  }
}
