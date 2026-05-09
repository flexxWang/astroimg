import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUserDto {
  @ApiPropertyOptional({
    description: '用户名搜索关键词',
    example: 'astro',
  })
  @IsString()
  @IsOptional()
  keyword?: string;
}
