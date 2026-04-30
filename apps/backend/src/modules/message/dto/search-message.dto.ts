import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchMessageDto {
  @ApiPropertyOptional({
    description: '消息搜索关键词',
    example: '木星',
  })
  @IsString()
  @IsOptional()
  keyword?: string;
}
