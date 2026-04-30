import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Throttle } from '@/common/decorators/throttle.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { SignUploadDto } from './dto/sign-upload.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @Throttle({ limit: 30, ttl: 60 * 5, keyPrefix: 'upload-sign' })
  @ApiOperation({ summary: '生成 MinIO 直传签名' })
  @Post('sign')
  signUpload(@Body() dto: SignUploadDto, @CurrentUser() user: { id: string }) {
    return this.uploadService.signUpload(
      user.id,
      dto.filename,
      dto.contentType,
      dto.fileSize,
    );
  }
}
