import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  CallHandler,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of, firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import appConfig from '../src/config/app.config';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { ThrottleGuard } from '../src/common/guards/throttle.guard';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { UploadService } from '../src/modules/upload/upload.service';

describe('Backend infrastructure smoke tests', () => {
  let moduleFixture: TestingModule;
  let appController: AppController;
  let appService: AppService;
  let authController: AuthController;
  let throttleGuard: ThrottleGuard;
  let responseInterceptor: ResponseInterceptor;
  let uploadService: { checkHealth: jest.Mock };
  let cacheStore: Map<string, { value: unknown; expiresAt: number }>;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.TRUST_PROXY = 'false';
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.COOKIE_SECURE = 'true';
    process.env.COOKIE_SAME_SITE = 'none';

    cacheStore = new Map();
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
      controllers: [AppController, AuthController],
      providers: [
        AppService,
        ResponseInterceptor,
        ThrottleGuard,
        Reflector,
        {
          provide: CACHE_MANAGER,
          useValue: {
            async get(key: string) {
              const item = cacheStore.get(key);
              if (!item || item.expiresAt <= Date.now()) {
                cacheStore.delete(key);
                return undefined;
              }
              return item.value;
            },
            async set(key: string, value: unknown, ttl: number) {
              cacheStore.set(key, {
                value,
                expiresAt: Date.now() + ttl,
              });
            },
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
            login: jest.fn().mockResolvedValue({ accessToken: 'token-login' }),
            register: jest
              .fn()
              .mockResolvedValue({ accessToken: 'token-register' }),
          },
        },
      ],
    }).compile();

    appController = moduleFixture.get(AppController);
    appService = moduleFixture.get(AppService);
    authController = moduleFixture.get(AuthController);
    throttleGuard = moduleFixture.get(ThrottleGuard);
    responseInterceptor = moduleFixture.get(ResponseInterceptor);
  });

  afterEach(async () => {
    await moduleFixture.close();
    jest.resetAllMocks();
  });

  it('returns live health information', () => {
    const result = appController.live();

    expect(result.status).toBe('ok');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeTruthy();
  });

  it('returns ready status when dependencies are healthy', async () => {
    const result = await appService.ready();

    expect(result.status).toBe('ok');
    expect(result.dependencies.database.status).toBe('up');
    expect(result.dependencies.cache.status).toBe('up');
    expect(result.dependencies.storage.status).toBe('up');
  });

  it('throws 503 from ready endpoint when dependency is down', async () => {
    uploadService.checkHealth.mockRejectedValueOnce(new Error('minio down'));

    await expect(appController.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('sets secure cookie options for auth login', async () => {
    const res = {
      cookie: jest.fn(),
    };

    const result = await authController.login(
      { usernameOrEmail: 'demo', password: 'secret123' },
      res as any,
    );

    expect(result.accessToken).toBe('token-login');
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'token-login',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }),
    );
  });

  it('throttles repeated auth login requests', async () => {
    const handler = AuthController.prototype.login;
    const clazz = AuthController;

    const createContext = (): ExecutionContext =>
      ({
        getHandler: () => handler,
        getClass: () => clazz,
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            route: { path: '/auth/login' },
            originalUrl: '/auth/login',
          }),
        }),
      }) as ExecutionContext;

    for (let i = 0; i < 5; i += 1) {
      await expect(throttleGuard.canActivate(createContext())).resolves.toBe(
        true,
      );
    }

    await expect(
      throttleGuard.canActivate(createContext()),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        errorCode: 'TOO_MANY_REQUESTS',
      }),
    });
  });

  it('wraps successful responses with request id metadata', async () => {
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({ statusCode: 200 }),
        getRequest: () => ({ requestId: 'req-test-1' }),
      }),
    } as ExecutionContext;
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
