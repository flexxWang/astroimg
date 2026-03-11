import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
