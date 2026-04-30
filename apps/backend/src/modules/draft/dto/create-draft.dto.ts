import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDraftDto {
  @ApiPropertyOptional({
    description: '草稿标题',
    example: '准备发的 M42 记录',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: '草稿正文',
    example: '今晚再补拍 30 分钟，明天整理后发布。',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
