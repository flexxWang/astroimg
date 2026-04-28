import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import type { Response } from 'express';
import appConfig from '../src/config/app.config';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ThrottleGuard } from '../src/common/guards/throttle.guard';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';
import { UploadService } from '../src/modules/upload/upload.service';

describe('Backend infrastructure smoke tests', () => {
  let moduleFixture: TestingModule;
  let healthController: HealthController;
  let healthService: HealthService;
  let authController: AuthController;
  let throttleGuard: ThrottleGuard;
  let responseInterceptor: ResponseInterceptor;
  let uploadService: { checkHealth: jest.Mock };
  let cacheStore: Map<string, { value: unknown; expiresAt: number }>;
  let cacheClient: { isReady: boolean };

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.TRUST_PROXY = 'false';
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.COOKIE_SECURE = 'true';
    process.env.COOKIE_SAME_SITE = 'none';

    cacheStore = new Map();
    cacheClient = { isReady: true };
    uploadService = {
      checkHealth: jest.fn().mockResolvedValue({
        bucket: 'astroimg',
        bucketExists: true,
      }),
    };

    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [appConfig],
        }),
      ],
      controllers: [HealthController, AuthController],
      providers: [
        HealthService,
        ResponseInterceptor,
        ThrottleGuard,
        Reflector,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get(key: string) {
              const item = cacheStore.get(key);
              if (!item || item.expiresAt <= Date.now()) {
                cacheStore.delete(key);
                return undefined;
              }
              return item.value;
            },
            set(key: string, value: unknown, ttl: number) {
              cacheStore.set(key, {
                value,
                expiresAt: Date.now() + ttl,
              });
            },
            del(key: string) {
              cacheStore.delete(key);
            },
            ttl(key: string) {
              const item = cacheStore.get(key);
              if (!item || item.expiresAt <= Date.now()) {
                cacheStore.delete(key);
                return 0;
              }
              return item.expiresAt - Date.now();
            },
            stores: [
              {
                store: {
                  getClient: jest.fn().mockResolvedValue(cacheClient),
                },
              },
            ],
          },
        },
        {
          provide: DataSource,
          useValue: {
            query: jest.fn().mockResolvedValue([{ ok: 1 }]),
          },
        },
        {
          provide: UploadService,
          useValue: uploadService,
        },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              accessToken: 'token-login',
              refreshToken: 'refresh-login',
            }),
            register: jest.fn().mockResolvedValue({
              accessToken: 'token-register',
              refreshToken: 'refresh-register',
            }),
            refresh: jest.fn().mockResolvedValue({
              accessToken: 'token-refresh',
              refreshToken: 'refresh-rotated',
            }),
            revokeAccessToken: jest.fn().mockResolvedValue(undefined),
            revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    healthController = moduleFixture.get(HealthController);
    healthService = moduleFixture.get(HealthService);
    authController = moduleFixture.get(AuthController);
    throttleGuard = moduleFixture.get(ThrottleGuard);
    responseInterceptor = moduleFixture.get(ResponseInterceptor);
  });

  afterEach(async () => {
    await moduleFixture.close();
    jest.resetAllMocks();
  });

  it('returns live health information', () => {
    const result = healthController.live();

    expect(result.status).toBe('ok');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeTruthy();
  });

  it('returns ready status when dependencies are healthy', async () => {
    const result = await healthService.ready();

    expect(result.status).toBe('ok');
    expect(result.dependencies.database.status).toBe('up');
    expect(result.dependencies.cache.status).toBe('up');
    expect(result.dependencies.cache.details).toMatchObject({
      clientReady: true,
    });
    expect(result.dependencies.storage.status).toBe('up');
  });

  it('throws 503 from ready endpoint when dependency is down', async () => {
    uploadService.checkHealth.mockRejectedValueOnce(new Error('minio down'));

    await expect(healthController.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('reports degraded status when redis cache client is not ready', async () => {
    cacheClient.isReady = false;

    await expect(healthController.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('sets secure cookie options for auth login', async () => {
    const cookie = jest.fn();
    const res = {
      cookie,
    } as Pick<Response, 'cookie'> as Response;

    const result = await authController.login(
      { usernameOrEmail: 'demo', password: 'secret123' },
      res,
    );

    expect(result.accessToken).toBe('token-login');
    expect(cookie).toHaveBeenCalledWith(
      'access_token',
      'token-login',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
    expect(cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-login',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
  });

  it('rotates refresh tokens and resets auth cookies', async () => {
    const cookie = jest.fn();
    const res = {
      cookie,
    } as Pick<Response, 'cookie'> as Response;
    const authService = moduleFixture.get<{
      refresh: jest.Mock;
    }>(AuthService);

    const result = await authController.refresh(
      {
        cookies: { refresh_token: 'refresh-cookie' },
      } as unknown as Parameters<AuthController['refresh']>[0],
      res,
    );

    expect(authService.refresh).toHaveBeenCalledWith('refresh-cookie');
    expect(result.accessToken).toBe('token-refresh');
    expect(cookie).toHaveBeenCalledWith(
      'access_token',
      'token-refresh',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-rotated',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('revokes the current token on logout and clears the cookie', async () => {
    const clearCookie = jest.fn();
    const res = {
      clearCookie,
    } as Pick<Response, 'clearCookie'> as Response;
    const authService = moduleFixture.get<{
      revokeAccessToken: jest.Mock;
      revokeRefreshToken: jest.Mock;
    }>(AuthService);

    await authController.logout(
      {
        cookies: {
          access_token: 'token-cookie',
          refresh_token: 'refresh-cookie',
        },
        get: jest.fn(),
      } as unknown as Parameters<AuthController['logout']>[0],
      res,
    );

    expect(authService.revokeAccessToken).toHaveBeenCalledWith('token-cookie');
    expect(authService.revokeRefreshToken).toHaveBeenCalledWith(
      'refresh-cookie',
    );
    expect(clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
    expect(clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
  });

  it('throttles repeated auth login requests', async () => {
    const clazz = AuthController;

    const createContext = (): ExecutionContext =>
      ({
        getHandler: () =>
          Reflect.get(AuthController.prototype, 'login') as (
            ...args: unknown[]
          ) => unknown,
        getClass: () => clazz,
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            route: { path: '/auth/login' },
            originalUrl: '/auth/login',
          }),
        }),
      }) as unknown as ExecutionContext;

    for (let i = 0; i < 5; i += 1) {
      await expect(throttleGuard.canActivate(createContext())).resolves.toBe(
        true,
      );
    }

    const thrown = await throttleGuard
      .canActivate(createContext())
      .catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getResponse()).toMatchObject({
      errorCode: 'TOO_MANY_REQUESTS',
    });
  });

  it('wraps successful responses with request id metadata', async () => {
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }) as Response,
        getRequest: () => ({ requestId: 'req-test-1' }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: () => of({ status: 'ok' }),
    };

    const result = await firstValueFrom(
      responseInterceptor.intercept(context, next),
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: 200,
        data: { status: 'ok' },
        msg: 'ok',
        requestId: 'req-test-1',
      }),
    );
  });
});
