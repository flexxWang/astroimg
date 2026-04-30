import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
import { DraftService } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@ApiTags('Drafts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiCookieAuth('access_token')
@Controller('drafts')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @ApiOperation({ summary: '获取当前用户草稿列表' })
  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.draftService.list(user.id);
  }

  @ApiOperation({ summary: '获取草稿详情' })
  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftService.findById(user.id, id);
  }

  @ApiOperation({ summary: '创建草稿' })
  @Post()
  create(@Body() dto: CreateDraftDto, @CurrentUser() user: { id: string }) {
    return this.draftService.create(user.id, dto);
  }

  @ApiOperation({ summary: '更新草稿' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.draftService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: '发布草稿并转成帖子' })
  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftService.publish(user.id, id);
  }
}
