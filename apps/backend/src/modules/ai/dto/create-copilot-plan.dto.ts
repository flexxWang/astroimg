import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCopilotPlanDto {
  @ApiProperty({
    description: '观测地点名称',
    example: '崇明东滩',
    maxLength: 120,
  })
  @IsString()
  @MaxLength(120)
  locationName: string;

  @ApiPropertyOptional({
    description: '观测地点纬度',
    example: 31.5086,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: '观测地点经度',
    example: 121.9053,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: '设备类型',
    example: 'telescope',
    maxLength: 80,
  })
  @IsString()
  @MaxLength(80)
  deviceType: string;

  @ApiPropertyOptional({
    description: '设备型号',
    example: 'Sky-Watcher 150/750',
    maxLength: 80,
  })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  deviceModel?: string;

  @ApiProperty({
    description: '计划开始时间，ISO 8601 格式',
    example: '2026-05-09T13:00:00.000Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: '计划结束时间，ISO 8601 格式',
    example: '2026-05-09T17:00:00.000Z',
  })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    description: '观测偏好',
    enum: ['moon', 'planet', 'deep-sky', 'wide-field', 'mixed'],
    example: 'deep-sky',
  })
  @IsString()
  @IsOptional()
  @IsIn(['moon', 'planet', 'deep-sky', 'wide-field', 'mixed'])
  preference?: 'moon' | 'planet' | 'deep-sky' | 'wide-field' | 'mixed';

  @ApiPropertyOptional({
    description: '用户经验水平',
    enum: ['beginner', 'intermediate', 'advanced'],
    example: 'intermediate',
  })
  @IsString()
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: 'beginner' | 'intermediate' | 'advanced';

  @ApiPropertyOptional({
    description: '可用观测时长，单位分钟',
    example: 180,
    minimum: 15,
  })
  @IsNumber()
  @IsOptional()
  @Min(15)
  availableMinutes?: number;
}
