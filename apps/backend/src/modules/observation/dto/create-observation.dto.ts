import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateObservationDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  lightPollution?: number;

  @IsNumber()
  @IsOptional()
  elevation?: number;
}
