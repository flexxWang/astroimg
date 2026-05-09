import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: '评论内容',
    example: '这张细节很好，能分享一下曝光参数吗？',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
