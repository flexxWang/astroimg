import { IsNotEmpty, IsString } from 'class-validator';

export class FollowStatusDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
