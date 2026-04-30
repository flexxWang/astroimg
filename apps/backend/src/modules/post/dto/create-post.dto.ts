import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: '帖子标题',
    example: '昨晚拍到的猎户座大星云',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: '帖子正文内容，支持纯文本',
    example: 'Bortle 4 天空下拍了 2 小时，后期叠加效果很不错。',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
