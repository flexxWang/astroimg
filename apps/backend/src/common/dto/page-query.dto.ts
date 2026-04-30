import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class PageQueryDto {
  @ApiPropertyOptional({
    description: '页码，从 1 开始',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => toNumber(value, 1))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: '每页条数，最大 50',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Transform(({ value }) => toNumber(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 10;
}

export class KeywordPageQueryDto extends PageQueryDto {
  @ApiPropertyOptional({
    description: '关键词搜索',
    example: 'orion',
    default: '',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  @IsString()
  keyword = '';
}
