import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDraftDto {
  @ApiPropertyOptional({
    description: '更新后的草稿标题',
    example: '更新后的 M42 草稿',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: '更新后的草稿正文',
    example: '已经补完后期处理，准备发布。',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
