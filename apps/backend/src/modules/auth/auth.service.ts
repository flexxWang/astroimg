import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { AppException, ErrorCode } from '@/common/exceptions';
import { RequestContextService } from '@/common/context/request-context.service';
import { MetricsService } from '@/common/observability/metrics.service';
import { hashPassword, comparePassword } from '@/common/utils/crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type RevocableJwtPayload = {
  sub?: string;
  username?: string;
  email?: string;
  jti?: string;
  exp?: number;
  type?: 'access' | 'refresh';
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAILURE_ACCOUNT_LIMIT = 5;
const LOGIN_FAILURE_IP_LIMIT = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly requestContext: RequestContextService,
    private readonly metricsService: MetricsService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsernameOrEmail(dto.username);
    if (exists) {
      throw AppException.conflict(ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    const existsEmail = await this.userService.findByUsernameOrEmail(dto.email);
    if (existsEmail) {
      throw AppException.conflict(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.userService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });

    return this.signTokenPair(user.id, user.username, user.email);
  }

  async login(dto: LoginDto) {
    const accountKey = this.normalizeLoginIdentifier(dto.usernameOrEmail);
    await this.assertLoginAllowed(accountKey);

    const user = await this.userService.findByUsernameOrEmail(
      dto.usernameOrEmail,
      true,
    );
    if (!user) {
      await this.recordLoginFailure(accountKey);
      throw AppException.unauthorized(ErrorCode.INVALID_CREDENTIALS);
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      await this.recordLoginFailure(accountKey);
      throw AppException.unauthorized(ErrorCode.INVALID_CREDENTIALS);
    }

    await this.clearLoginFailures(accountKey);
    return this.signTokenPair(user.id, user.username, user.email);
  }

  private async signTokenPair(
    id: string,
    username: string,
    email: string,
  ): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      {
        sub: id,
        username,
        email,
        type: 'access',
        jti: randomUUID(),
      },
      {
        expiresIn: this.configService.getOrThrow<SignOptions['expiresIn']>(
          'jwt.accessExpiresIn',
        ),
      },
    );
    const refreshJti = randomUUID();
    const refreshToken = this.jwtService.sign(
      {
        sub: id,
        username,
        email,
        type: 'refresh',
        jti: refreshJti,
      },
      {
        expiresIn: this.configService.getOrThrow<SignOptions['expiresIn']>(
          'jwt.refreshExpiresIn',
        ),
      },
    );
    const payload = this.jwtService.verify<RevocableJwtPayload>(refreshToken);
    const ttlMs = this.remainingTtlMs(payload.exp);

    await this.cacheManager.set(this.refreshTokenKey(refreshJti), id, ttlMs);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken?: string | null) {
    if (!refreshToken) {
      throw AppException.unauthorized(ErrorCode.UNAUTHORIZED);
    }

    try {
      const payload = this.jwtService.verify<RevocableJwtPayload>(refreshToken);
      if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
        throw AppException.unauthorized(ErrorCode.UNAUTHORIZED);
      }

      const key = this.refreshTokenKey(payload.jti);
      const storedUserId = await this.cacheManager.get<string>(key);
      if (storedUserId !== payload.sub) {
        throw AppException.unauthorized(ErrorCode.UNAUTHORIZED);
      }

      const user = await this.userService.findByIdPublic(payload.sub);
      if (!user) {
        throw AppException.unauthorized(ErrorCode.UNAUTHORIZED);
      }

      await this.deleteCacheKey(key);
      return this.signTokenPair(user.id, user.username, user.email);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.unauthorized(ErrorCode.UNAUTHORIZED);
    }
  }

  async revokeAccessToken(token?: string | null) {
    if (!token) {
      return;
    }

    try {
      const payload = this.jwtService.verify<RevocableJwtPayload>(token);
      if (!payload.jti || !payload.exp) {
        return;
      }

      const ttlMs = this.remainingTtlMs(payload.exp);
      await this.cacheManager.set(
        this.revokedTokenKey(payload.jti),
        true,
        ttlMs,
      );
    } catch {
      // Logout should still clear the browser cookie when the token is stale.
    }
  }

  async isTokenRevoked(jti: string) {
    return Boolean(await this.cacheManager.get(this.revokedTokenKey(jti)));
  }

  async revokeRefreshToken(token?: string | null) {
    if (!token) {
      return;
    }

    try {
      const payload = this.jwtService.verify<RevocableJwtPayload>(token);
      if (payload.type !== 'refresh' || !payload.jti) {
        return;
      }

      await this.deleteCacheKey(this.refreshTokenKey(payload.jti));
    } catch {
      // Logout should still clear the browser cookie when the token is stale.
    }
  }

  private remainingTtlMs(exp?: number) {
    if (!exp) {
      return 1;
    }

    return Math.max(exp * 1000 - Date.now(), 1);
  }

  private async deleteCacheKey(key: string) {
    const cacheWithDel = this.cacheManager as Cache & {
      del?: (key: string) => Promise<void> | void;
    };

    await cacheWithDel.del?.(key);
  }

  private revokedTokenKey(jti: string) {
    return `auth:revoked:${jti}`;
  }

  private refreshTokenKey(jti: string) {
    return `auth:refresh:${jti}`;
  }

  private loginFailureAccountKey(identifier: string) {
    return `auth:login-fail:account:${identifier}`;
  }

  private loginFailureIpKey(ip: string) {
    return `auth:login-fail:ip:${ip}`;
  }

  private normalizeLoginIdentifier(value: string) {
    return value.trim().toLowerCase();
  }

  private getLoginFailureIp() {
    return this.requestContext.getIp()?.trim() || 'unknown';
  }

  private async assertLoginAllowed(accountKey: string) {
    const ipKey = this.loginFailureIpKey(this.getLoginFailureIp());
    const [accountAttempts, ipAttempts] = await Promise.all([
      this.cacheManager.get<number>(this.loginFailureAccountKey(accountKey)),
      this.cacheManager.get<number>(ipKey),
    ]);

    if (
      (accountAttempts ?? 0) >= LOGIN_FAILURE_ACCOUNT_LIMIT ||
      (ipAttempts ?? 0) >= LOGIN_FAILURE_IP_LIMIT
    ) {
      this.metricsService.incrementCounter('auth_failures_total', {
        reason: 'rate_limited',
      });
      throw AppException.tooManyRequests(
        ErrorCode.TOO_MANY_REQUESTS,
        '登录失败次数过多，请稍后再试',
        {
          retryAfterSeconds: Math.ceil(LOGIN_FAILURE_WINDOW_MS / 1000),
        },
      );
    }
  }

  private async recordLoginFailure(accountKey: string) {
    const ipKey = this.loginFailureIpKey(this.getLoginFailureIp());
    await Promise.all([
      this.incrementFailureCounter(this.loginFailureAccountKey(accountKey)),
      this.incrementFailureCounter(ipKey),
    ]);
    this.metricsService.incrementCounter('auth_failures_total', {
      reason: 'invalid_credentials',
    });
  }

  private async clearLoginFailures(accountKey: string) {
    const ipKey = this.loginFailureIpKey(this.getLoginFailureIp());
    await Promise.all([
      this.deleteCacheKey(this.loginFailureAccountKey(accountKey)),
      this.deleteCacheKey(ipKey),
    ]);
  }

  private async incrementFailureCounter(key: string) {
    const current = (await this.cacheManager.get<number>(key)) ?? 0;
    await this.cacheManager.set(key, current + 1, LOGIN_FAILURE_WINDOW_MS);
  }
}
