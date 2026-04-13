import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Throttle } from '@/common/decorators/throttle.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { SignUploadDto } from './dto/sign-upload.dto';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ limit: 30, ttl: 60 * 5, keyPrefix: 'upload-sign' })
  @Post('sign')
  signUpload(@Body() dto: SignUploadDto, @CurrentUser() user: { id: string }) {
    return this.uploadService.signUpload(user.id, dto.filename);
  }
}
