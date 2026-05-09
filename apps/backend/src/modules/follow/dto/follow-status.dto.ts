import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FollowStatusDto {
  @ApiProperty({
    description: '目标用户 ID',
    example: 'cd06f8f4-e4a6-42fc-9fc1-9fe522f4a424',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
