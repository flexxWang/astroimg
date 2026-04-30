import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListMessageDto {
  @ApiPropertyOptional({
    description: '游标分页参数，通常传上一页最后一条消息的创建时间或 ID',
    example: '2026-04-30T10:00:00.000Z',
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
