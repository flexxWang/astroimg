import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCopilotPlanDto {
  @IsString()
  @MaxLength(120)
  locationName: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @MaxLength(80)
  deviceType: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  deviceModel?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  @IsIn(['moon', 'planet', 'deep-sky', 'wide-field', 'mixed'])
  preference?: 'moon' | 'planet' | 'deep-sky' | 'wide-field' | 'mixed';

  @IsString()
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: 'beginner' | 'intermediate' | 'advanced';

  @IsNumber()
  @IsOptional()
  @Min(15)
  availableMinutes?: number;
}
