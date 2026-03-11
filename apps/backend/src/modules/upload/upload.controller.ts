import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('uploads')
export class UploadController {
  @UseGuards(JwtAuthGuard)
  @Post('sign')
  signUpload() {
    return { uploadUrl: '' };
  }
}
