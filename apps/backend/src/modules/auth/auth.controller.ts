import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { Throttle } from '@/common/decorators/throttle.decorator';
import type { RequestWithContext } from '@/common/http/request.types';
import { CSRF_COOKIE_NAME } from '@/common/middleware/csrf.middleware';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

function durationToMs(value: string, fallbackMs: number) {
  const normalized = value.trim().toLowerCase();
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    return numeric * 1000;
  }

  const match = normalized.match(DURATION_PATTERN);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multiplier[unit];
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private buildCookieOptions(kind: 'access' | 'refresh') {
    const expiresIn =
      kind === 'access'
        ? this.configService.get<string>('jwt.accessExpiresIn') || '1h'
        : this.configService.get<string>('jwt.refreshExpiresIn') || '30d';

    return {
      httpOnly: true,
      sameSite: this.configService.get<'lax' | 'strict' | 'none'>(
        'app.cookie.sameSite',
      ),
      secure: this.configService.get<boolean>('app.cookie.secure') ?? false,
      domain: this.configService.get<string | undefined>('app.cookie.domain'),
      maxAge: durationToMs(
        expiresIn,
        kind === 'access' ? 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000,
      ),
    };
  }

  private buildClearCookieOptions() {
    const { maxAge, ...options } = this.buildCookieOptions('access');
    void maxAge;
    return options;
  }

  private buildCsrfCookieOptions() {
    const { httpOnly, maxAge, ...options } = this.buildCookieOptions('access');
    void httpOnly;
    void maxAge;
    return {
      ...options,
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
    };
  }

  private setCsrfCookie(res: Response) {
    const csrfToken = randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, this.buildCsrfCookieOptions());
    return csrfToken;
  }

  private extractAccessToken(req: RequestWithContext) {
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

  private extractRefreshToken(req: RequestWithContext) {
    return req.cookies?.refresh_token;
  }

  private setAuthCookies(
    res: Response,
    result: Awaited<ReturnType<AuthService['login']>>,
  ) {
    res.cookie(
      'access_token',
      result.accessToken,
      this.buildCookieOptions('access'),
    );
    res.cookie(
      'refresh_token',
      result.refreshToken,
      this.buildCookieOptions('refresh'),
    );
    this.setCsrfCookie(res);
  }

  @ApiOperation({ summary: '签发浏览器写请求使用的 CSRF token cookie' })
  @Get('csrf')
  csrf(@Res({ passthrough: true }) res: Response) {
    return {
      csrfToken: this.setCsrfCookie(res),
    };
  }

  @Throttle({ limit: 10, ttl: 60 * 10, keyPrefix: 'auth-register' })
  @ApiOperation({ summary: '注册账号' })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result);
    return result;
  }

  @Throttle({ limit: 5, ttl: 60 * 10, keyPrefix: 'auth-login' })
  @ApiOperation({ summary: '登录并签发 access/refresh token' })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result);
    return result;
  }

  @Throttle({ limit: 30, ttl: 60 * 10, keyPrefix: 'auth-refresh' })
  @ApiOperation({ summary: '刷新 access token，并轮换 refresh token' })
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(
      this.extractRefreshToken(req),
    );
    this.setAuthCookies(res, result);
    return result;
  }

  @ApiOperation({ summary: '退出登录并撤销当前会话 token' })
  @Post('logout')
  async logout(
    @Req() req: RequestWithContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeAccessToken(this.extractAccessToken(req));
    await this.authService.revokeRefreshToken(this.extractRefreshToken(req));
    res.clearCookie('access_token', this.buildClearCookieOptions());
    res.clearCookie('refresh_token', this.buildClearCookieOptions());
    res.clearCookie(CSRF_COOKIE_NAME, this.buildClearCookieOptions());
    return null;
  }
}
