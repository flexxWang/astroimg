import { Body, Controller, Get, Param, Post as HttpPost, Query, UseGuards } from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    return this.workService.list(pageNum, pageSizeNum);
  }

  @Get('user/:userId')
  listByUser(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    return this.workService.listByAuthor(userId, pageNum, pageSizeNum);
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
