import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({
    description: '会话 ID',
    example: '3ec6f78a-6320-4d0e-b3f3-f59d5ed0d720',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
