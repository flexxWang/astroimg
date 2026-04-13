import { Body, Controller, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Throttle } from '@/common/decorators/throttle.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private buildCookieOptions() {
    return {
      httpOnly: true,
      sameSite: this.configService.get<'lax' | 'strict' | 'none'>(
        'app.cookie.sameSite',
      ),
      secure: this.configService.get<boolean>('app.cookie.secure') ?? false,
      domain: this.configService.get<string | undefined>('app.cookie.domain'),
      maxAge: this.configService.get<number>('app.cookie.maxAge'),
    };
  }

  @Throttle({ limit: 10, ttl: 60 * 10, keyPrefix: 'auth-register' })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    res.cookie('access_token', result.accessToken, this.buildCookieOptions());
    return result;
  }

  @Throttle({ limit: 5, ttl: 60 * 10, keyPrefix: 'auth-login' })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie('access_token', result.accessToken, this.buildCookieOptions());
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', this.buildCookieOptions());
    return null;
  }
}
