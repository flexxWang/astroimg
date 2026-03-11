import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleFollowDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
