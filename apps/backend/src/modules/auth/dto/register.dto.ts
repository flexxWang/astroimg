import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用户名，公开展示使用',
    example: 'astro_alice',
    maxLength: 32,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '登录邮箱',
    example: 'alice@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '登录密码，至少 10 位，且至少包含一个字母和一个数字',
    example: 'astroPass2026',
    minLength: 10,
    maxLength: 128,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码至少包含一个字母和一个数字',
  })
  password: string;
}
