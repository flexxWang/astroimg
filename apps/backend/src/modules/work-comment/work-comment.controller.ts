import {
  Body,
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
import { WorkCommentService } from './work-comment.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateWorkCommentDto } from './dto/create-work-comment.dto';

@ApiTags('Work Comments')
@Controller('works/:workId/comments')
export class WorkCommentController {
  constructor(private readonly commentService: WorkCommentService) {}

  @ApiOperation({ summary: '获取作品评论列表' })
  @Get()
  list(@Param('workId') workId: string) {
    return this.commentService.listByWork(workId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '发表作品评论' })
  @HttpPost()
  create(
    @Param('workId') workId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWorkCommentDto,
  ) {
    return this.commentService.create(workId, user.id, dto);
  }
}
