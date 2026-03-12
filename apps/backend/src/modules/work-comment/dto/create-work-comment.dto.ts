import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWorkCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  content: string;
}
