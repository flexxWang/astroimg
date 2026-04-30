import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'alice@example.com',
  })
  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string;

  @ApiProperty({
    description: '登录密码',
    example: 'astroPass2026',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
