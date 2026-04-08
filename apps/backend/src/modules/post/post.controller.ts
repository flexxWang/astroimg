import { Body, Controller, Get, Param, Post as HttpPost, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  KeywordPageQueryDto,
  PageQueryDto,
} from '../../common/dto/page-query.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  list(@Query() query: KeywordPageQueryDto) {
    return this.postService.findAll(query.page, query.pageSize, query.keyword);
  }

  @Get('user/:userId')
  listByUser(@Param('userId') userId: string, @Query() query: PageQueryDto) {
    return this.postService.findByAuthor(userId, query.page, query.pageSize);
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
