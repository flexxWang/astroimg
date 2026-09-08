import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Throttle } from '@/common/decorators/throttle.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { SignUploadDto } from './dto/sign-upload.dto';
import { SignUploadResponseDto } from './dto/sign-upload-response.dto';

@ApiTags('Uploads')
@ApiExtraModels(SignUploadResponseDto)
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @Throttle({ limit: 30, ttl: 60 * 5, keyPrefix: 'upload-sign' })
  @ApiOperation({
    summary: '生成 MinIO 直传签名',
    description:
      '客户端先提交文件名、MIME type 和建议的 fileSize 获取签名，再使用返回的 uploadUrl 和 formData 发起 multipart/form-data POST，并把文件作为 file 字段追加到表单末尾。fileSize 可用于提前拒绝超限请求；实际上传大小仍由服务端生成的 MinIO policy 强制限制。',
  })
  @ApiOkResponse({
    description: 'MinIO POST policy 直传签名',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        data: { $ref: getSchemaPath(SignUploadResponseDto) },
        msg: { type: 'string', example: 'ok' },
        requestId: { type: 'string', example: 'req_abc123' },
        traceId: { type: 'string', example: 'trace_abc123' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2026-09-08T08:00:00.000Z',
        },
      },
    },
  })
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
