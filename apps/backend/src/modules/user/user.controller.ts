import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SearchUserDto } from './dto/search-user.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '获取当前登录用户资料' })
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.userService.findProfile(user.id);
  }

  @ApiOperation({ summary: '获取指定用户资料' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findProfile(id);
  }

  @ApiOperation({ summary: '按关键词搜索用户' })
  @Get()
  search(@Query() dto: SearchUserDto) {
    return this.userService.search(dto.keyword);
  }
}
