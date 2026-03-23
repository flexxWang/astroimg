import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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
  @IsIn(['image', 'video'])
  @IsNotEmpty()
  mediaType: 'image' | 'video';

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(9)
  imageUrls?: string[];

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsUUID()
  @IsOptional()
  typeId?: string;

  @IsUUID()
  @IsOptional()
  deviceId?: string;
}
