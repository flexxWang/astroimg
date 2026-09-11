import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: '更新后的帖子标题',
    example: '更新后的猎户座大星云记录',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: '更新后的帖子正文',
    example: '补充了拍摄参数和后期处理步骤。',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  content?: string;
}
