import {
  Body,
  Controller,
  Get,
  Param,
  Post as HttpPost,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { KeywordPageQueryDto, PageQueryDto } from '@/common/dto/page-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOperation({ summary: '分页获取帖子列表，可按关键词搜索' })
  @Get()
  list(@Query() query: KeywordPageQueryDto) {
    return this.postService.findAll(query.page, query.pageSize, query.keyword);
  }

  @ApiOperation({ summary: '获取指定用户发布的帖子列表' })
  @Get('user/:userId')
  listByUser(@Param('userId') userId: string, @Query() query: PageQueryDto) {
    return this.postService.findByAuthor(userId, query.page, query.pageSize);
  }

  @ApiOperation({ summary: '获取帖子详情' })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '发布帖子' })
  @HttpPost()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: { id: string }) {
    return this.postService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '更新本人发布的帖子' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.postService.update(user.id, id, dto);
  }
}
