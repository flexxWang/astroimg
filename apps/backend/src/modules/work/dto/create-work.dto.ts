import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWorkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsUUID()
  @IsOptional()
  typeId?: string;

  @IsUUID()
  @IsOptional()
  deviceId?: string;
}
