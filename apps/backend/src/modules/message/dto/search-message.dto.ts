import { IsOptional, IsString } from 'class-validator';

export class SearchMessageDto {
  @IsString()
  @IsOptional()
  keyword?: string;
}
