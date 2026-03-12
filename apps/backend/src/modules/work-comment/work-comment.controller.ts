import { Body, Controller, Get, Param, Post as HttpPost, UseGuards } from '@nestjs/common';
import { WorkCommentService } from './work-comment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateWorkCommentDto } from './dto/create-work-comment.dto';

@Controller('works/:workId/comments')
export class WorkCommentController {
  constructor(private readonly commentService: WorkCommentService) {}

  @Get()
  list(@Param('workId') workId: string) {
    return this.commentService.listByWork(workId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(
    @Param('workId') workId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWorkCommentDto,
  ) {
    return this.commentService.create(workId, user.id, dto);
  }
}
