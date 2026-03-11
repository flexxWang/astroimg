import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DraftService } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@UseGuards(JwtAuthGuard)
@Controller('drafts')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.draftService.list(user.id);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftService.findById(user.id, id);
  }

  @Post()
  create(@Body() dto: CreateDraftDto, @CurrentUser() user: { id: string }) {
    return this.draftService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.draftService.update(user.id, id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.draftService.publish(user.id, id);
  }
}
