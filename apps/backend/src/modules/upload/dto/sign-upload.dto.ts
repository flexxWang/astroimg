import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUploadDto {
  @ApiProperty({
    description: '原始文件名，需要带扩展名',
    example: 'm42-stack.webp',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filename: string;

  @ApiProperty({
    description: '文件 MIME type，需要命中服务端白名单',
    example: 'image/webp',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contentType: string;

  @ApiProperty({
    description: '文件大小，单位字节',
    example: 5242880,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  fileSize: number;
}
