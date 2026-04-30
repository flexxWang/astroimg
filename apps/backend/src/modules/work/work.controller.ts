import {
  Body,
  Controller,
  Get,
  Param,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PageQueryDto } from '@/common/dto/page-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Works')
@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @ApiOperation({ summary: '分页获取作品列表' })
  @Get()
  list(@Query() query: PageQueryDto) {
    return this.workService.list(query.page, query.pageSize);
  }

  @ApiOperation({ summary: '获取指定用户发布的作品列表' })
  @Get('user/:userId')
  listByUser(@Param('userId') userId: string, @Query() query: PageQueryDto) {
    return this.workService.listByAuthor(userId, query.page, query.pageSize);
  }

  @ApiOperation({ summary: '获取作品类型列表' })
  @Get('types')
  listTypes() {
    return this.workService.listTypes();
  }

  @ApiOperation({ summary: '获取设备类型列表' })
  @Get('devices')
  listDevices() {
    return this.workService.listDevices();
  }

  @ApiOperation({ summary: '获取作品详情' })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.workService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '发布作品' })
  @HttpPost()
  create(@Body() dto: CreateWorkDto, @CurrentUser() user: { id: string }) {
    return this.workService.create(user.id, dto);
  }
}
