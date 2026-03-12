import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { SignUploadDto } from './dto/sign-upload.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sign')
  signUpload(
    @Body() dto: SignUploadDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.uploadService.signUpload(user.id, dto.filename);
  }
}
