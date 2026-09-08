import { ApiProperty } from '@nestjs/swagger';

export class SignUploadResponseDto {
  @ApiProperty({
    description:
      'MinIO 直传地址。客户端需要使用 multipart/form-data 发起 POST。',
    example: 'http://localhost:9000/astroimg',
  })
  uploadUrl: string;

  @ApiProperty({
    description: '直传请求方法。当前使用 MinIO POST policy。',
    example: 'POST',
    enum: ['POST'],
  })
  method: 'POST';

  @ApiProperty({
    description:
      'MinIO POST policy 表单字段。客户端需按原样附加这些字段，再追加 file 字段。',
    type: 'object',
    additionalProperties: { type: 'string' },
    example: {
      bucket: 'astroimg',
      key: 'works/user-id/upload-id-m42.webp',
      'Content-Type': 'image/webp',
      policy: 'base64-policy',
      'x-amz-signature': 'signature',
    },
  })
  formData: Record<string, string>;

  @ApiProperty({
    description: '上传成功后可访问的文件 URL。',
    example: 'http://localhost:9000/astroimg/works/user-id/upload-id-m42.webp',
  })
  fileUrl: string;

  @ApiProperty({
    description: '对象存储 key。',
    example: 'works/user-id/upload-id-m42.webp',
  })
  objectKey: string;

  @ApiProperty({
    description: '服务端允许的最大上传字节数。MinIO policy 会强制执行。',
    example: 52428800,
  })
  maxUploadBytes: number;

  @ApiProperty({
    description: '签名有效期，单位秒。',
    example: 600,
  })
  expiresInSeconds: number;
}
