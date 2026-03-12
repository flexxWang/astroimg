import { IsOptional, IsString } from 'class-validator';

export class ListMessageDto {
  @IsString()
  @IsOptional()
  cursor?: string;
}
