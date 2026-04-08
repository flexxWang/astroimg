import { Body, Controller, Get, Param, Post as HttpPost, Query, UseGuards } from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PageQueryDto } from '../../common/dto/page-query.dto';

@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get()
  list(@Query() query: PageQueryDto) {
    return this.workService.list(query.page, query.pageSize);
  }

  @Get('user/:userId')
  listByUser(@Param('userId') userId: string, @Query() query: PageQueryDto) {
    return this.workService.listByAuthor(userId, query.page, query.pageSize);
  }

  @Get('types')
  listTypes() {
    return this.workService.listTypes();
  }

  @Get('devices')
  listDevices() {
    return this.workService.listDevices();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.workService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreateWorkDto, @CurrentUser() user: { id: string }) {
    return this.workService.create(user.id, dto);
  }
}
