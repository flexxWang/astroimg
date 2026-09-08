import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignUploadDto {
  @ApiProperty({
    description: '原始文件名，需要带扩展名',
    example: 'm42-stack.webp',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filename: string;

  @ApiProperty({
    description: '文件 MIME type，需要命中服务端白名单',
    example: 'image/webp',
    maxLength: 100,
    enum: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'video/mp4',
      'video/quicktime',
      'application/fits',
      'application/x-fits',
    ],
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contentType: string;

  @ApiPropertyOptional({
    description:
      '文件大小，单位字节。用于服务端提前拒绝超限请求；最终上传大小仍由 MinIO policy 强制限制。',
    example: 5242880,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  fileSize?: number;
}
