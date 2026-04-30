import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkDto {
  @ApiProperty({
    description: '作品标题',
    example: 'M31 Andromeda Galaxy',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: '作品描述',
    example: '累计曝光 90 分钟，RGB 合成。',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: '媒体类型',
    enum: ['image', 'video'],
    example: 'image',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['image', 'video'])
  @IsNotEmpty()
  mediaType: 'image' | 'video';

  @ApiPropertyOptional({
    description: '图片 URL 列表。mediaType=image 时至少提供一张，最多 9 张。',
    example: [
      'https://cdn.example.com/works/m31-1.webp',
      'https://cdn.example.com/works/m31-2.webp',
    ],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(9)
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: '视频 URL。mediaType=video 时必填。',
    example: 'https://cdn.example.com/works/m31.mp4',
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: '作品类型 ID',
    example: '4a8fd346-caf0-44bb-8b03-66ef07d65dcb',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  typeId?: string;

  @ApiPropertyOptional({
    description: '设备 ID',
    example: 'ff31b557-0b39-4dbb-9f41-f1de7a26ec2a',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  deviceId?: string;
}
