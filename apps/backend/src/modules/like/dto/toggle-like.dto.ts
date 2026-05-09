import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeDto {
  @ApiProperty({
    description: '帖子 ID',
    example: '5f2d16a1-71fd-4568-b4df-48ce5dddc9a7',
  })
  @IsString()
  @IsNotEmpty()
  postId: string;
}
