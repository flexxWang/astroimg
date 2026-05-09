import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkReadDto {
  @ApiProperty({
    description: '通知 ID',
    example: '08af387c-1b3f-4fe0-8ef6-07cf9cd4edb9',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}
