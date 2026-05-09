import {
  Body,
  Controller,
  Get,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ObservationService } from './observation.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateObservationDto } from './dto/create-observation.dto';

@ApiTags('Observation Points')
@Controller('observation-points')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  @ApiOperation({ summary: '获取观测点列表' })
  @Get()
  list() {
    return this.observationService.list();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '创建观测点' })
  @HttpPost()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateObservationDto,
  ) {
    return this.observationService.create(user.id, dto);
  }
}
