import {
  Body,
  Controller,
  Get,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import { ObservationService } from './observation.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateObservationDto } from './dto/create-observation.dto';

@Controller('observation-points')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  @Get()
  list() {
    return this.observationService.list();
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateObservationDto,
  ) {
    return this.observationService.create(user.id, dto);
  }
}
