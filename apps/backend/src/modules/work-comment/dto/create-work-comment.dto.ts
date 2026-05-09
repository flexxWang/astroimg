import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkCommentDto {
  @ApiProperty({
    description: '作品评论内容',
    example: '色彩处理很自然，星点也很圆。',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  content: string;
}
