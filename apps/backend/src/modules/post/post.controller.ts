import { Body, Controller, Get, Param, Post as HttpPost, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('keyword') keyword = '',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    return this.postService.findAll(pageNum, pageSizeNum, keyword.trim());
  }

  @Get('user/:userId')
  listByUser(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    return this.postService.findByAuthor(userId, pageNum, pageSizeNum);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: { id: string }) {
    return this.postService.create(user.id, dto);
  }
}
