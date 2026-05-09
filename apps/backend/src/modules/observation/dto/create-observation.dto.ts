import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObservationDto {
  @ApiProperty({
    description: '观测点名称',
    example: '崇明东滩观测点',
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    description: '观测点描述',
    example: '视野开阔，东侧低空遮挡较少。',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: '纬度',
    example: 31.5086,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: '经度',
    example: 121.9053,
  })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({
    description: '光污染等级，数值越低表示天空越暗',
    example: 4,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  lightPollution?: number;

  @ApiPropertyOptional({
    description: '海拔高度，单位米',
    example: 12,
  })
  @IsNumber()
  @IsOptional()
  elevation?: number;
}
