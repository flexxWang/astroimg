import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Throttle } from '@/common/decorators/throttle.decorator';
import type { RequestWithContext } from '@/common/http/request.types';
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

  private buildClearCookieOptions() {
    const { maxAge, ...options } = this.buildCookieOptions();
    void maxAge;
    return options;
  }

  private extractToken(req: RequestWithContext) {
    const cookieToken = req.cookies?.access_token;
    if (cookieToken) {
      return cookieToken;
    }

    const authorization = req.get('authorization');
    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' ? token : undefined;
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
  async logout(
    @Req() req: RequestWithContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeAccessToken(this.extractToken(req));
    res.clearCookie('access_token', this.buildClearCookieOptions());
    return null;
  }
}
