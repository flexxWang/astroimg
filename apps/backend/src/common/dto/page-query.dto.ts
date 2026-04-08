import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class PageQueryDto {
  @IsOptional()
  @Transform(({ value }) => toNumber(value, 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => toNumber(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 10;
}

export class KeywordPageQueryDto extends PageQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  @IsString()
  keyword = '';
}
