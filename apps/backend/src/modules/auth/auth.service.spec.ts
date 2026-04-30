import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RequestContextService } from '@/common/context/request-context.service';
import { ErrorCode } from '@/common/exceptions';
import { MetricsService } from '@/common/observability/metrics.service';

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

type RefreshPayload = {
  jti: string;
  type: 'refresh';
};

type AppErrorLike = {
  response?: {
    errorCode?: string;
  };
};

describe('AuthService security flows', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let cacheStore: Map<string, CacheEntry>;
  let userService: {
    findByIdPublic: jest.Mock;
    findByUsernameOrEmail: jest.Mock;
  };
  let metricsService: {
    incrementCounter: jest.Mock;
  };

  beforeEach(() => {
    cacheStore = new Map();
    jwtService = new JwtService({ secret: 'test-secret' });

    const cacheManager: Cache = {
      get: jest.fn((key: string) => {
        const item = cacheStore.get(key);
        if (!item || item.expiresAt <= Date.now()) {
          cacheStore.delete(key);
          return undefined;
        }
        return item.value;
      }),
      set: jest.fn((key: string, value: unknown, ttl?: number) => {
        cacheStore.set(key, {
          value,
          expiresAt: Date.now() + (ttl ?? 0),
        });
      }),
      del: jest.fn((key: string) => {
        cacheStore.delete(key);
      }),
    } as unknown as Cache;

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        switch (key) {
          case 'jwt.accessExpiresIn':
            return '30s';
          case 'jwt.refreshExpiresIn':
            return '30d';
          default:
            throw new Error(`Unexpected config lookup: ${key}`);
        }
      }),
    } as unknown as ConfigService;

    userService = {
      findByIdPublic: jest.fn((id: string) => ({
        id,
        username: 'demo',
        email: 'demo@example.com',
      })),
      findByUsernameOrEmail: jest.fn(),
    };
    metricsService = {
      incrementCounter: jest.fn(),
    };

    authService = new AuthService(
      userService as never,
      jwtService,
      configService,
      cacheManager,
      {
        getIp: jest.fn(() => '127.0.0.1'),
      } as unknown as RequestContextService,
      metricsService as unknown as MetricsService,
    );
  });

  it('replaces the refresh token cache key when rotating a session', async () => {
    const firstPair = await (
      authService as unknown as {
        signTokenPair: (
          id: string,
          username: string,
          email: string,
        ) => Promise<{ accessToken: string; refreshToken: string }>;
      }
    ).signTokenPair('user-1', 'demo', 'demo@example.com');

    const firstPayload = jwtService.verify<RefreshPayload>(
      firstPair.refreshToken,
    );
    const firstKey = `auth:refresh:${firstPayload.jti}`;

    expect(cacheStore.get(firstKey)?.value).toBe('user-1');

    const secondPair = await authService.refresh(firstPair.refreshToken);
    const secondPayload = jwtService.verify<RefreshPayload>(
      secondPair.refreshToken,
    );
    const secondKey = `auth:refresh:${secondPayload.jti}`;

    expect(cacheStore.has(firstKey)).toBe(false);
    expect(cacheStore.get(secondKey)?.value).toBe('user-1');

    try {
      await authService.refresh(firstPair.refreshToken);
      fail('Expected refresh token reuse to be rejected');
    } catch (error) {
      const appError = error as AppErrorLike;
      expect(appError.response?.errorCode).toBe(ErrorCode.UNAUTHORIZED);
    }
  });

  it('rate limits repeated login failures by account and ip', async () => {
    userService.findByUsernameOrEmail.mockResolvedValue(undefined);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        authService.login({
          usernameOrEmail: 'demo@example.com',
          password: 'wrong-password-123',
        }),
      ).rejects.toMatchObject({
        response: {
          errorCode: ErrorCode.INVALID_CREDENTIALS,
        },
      });
    }

    await expect(
      authService.login({
        usernameOrEmail: 'demo@example.com',
        password: 'wrong-password-123',
      }),
    ).rejects.toMatchObject({
      response: {
        errorCode: ErrorCode.TOO_MANY_REQUESTS,
      },
    });

    expect(metricsService.incrementCounter).toHaveBeenCalledWith(
      'auth_failures_total',
      { reason: 'rate_limited' },
    );
  });
});
