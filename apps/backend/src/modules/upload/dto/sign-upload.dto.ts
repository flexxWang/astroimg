import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class SignUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filename: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contentType: string;

  @IsInt()
  @Min(1)
  fileSize: number;
}
