import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SignUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filename: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contentType?: string;
}
