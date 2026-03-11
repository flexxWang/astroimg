import { IsNotEmpty, IsString } from 'class-validator';

export class LikeStatusDto {
  @IsString()
  @IsNotEmpty()
  postId: string;
}
