import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import type { Cache } from 'cache-manager';
import { AppException, ErrorCode } from '@/common/exceptions';
import {
  THROTTLE_OPTIONS_KEY,
  THROTTLE_SKIP_KEY,
  type ThrottleOptions,
} from '@/common/decorators/throttle.decorator';

type RateLimitState = {
  count: number;
  resetAt: number;
};

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly defaultOptions: ThrottleOptions = {
    limit: 120,
    ttl: 60,
    keyPrefix: 'global',
  };

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const skip = this.reflector.getAllAndOverride<boolean>(THROTTLE_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) {
      return true;
    }

    const options =
      this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_OPTIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? this.defaultOptions;

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      route?: { path?: string };
      originalUrl?: string;
      user?: { id?: string };
    }>();
    const identity = request.user?.id || request.ip || 'anonymous';
    const path = request.route?.path || request.originalUrl || 'unknown';
    const key = `throttle:${options.keyPrefix || 'route'}:${identity}:${path}`;

    const now = Date.now();
    const cached =
      (await this.cacheManager.get<RateLimitState>(key)) ?? undefined;

    let nextState: RateLimitState;
    if (!cached || cached.resetAt <= now) {
      nextState = {
        count: 1,
        resetAt: now + options.ttl * 1000,
      };
    } else {
      nextState = {
        count: cached.count + 1,
        resetAt: cached.resetAt,
      };
    }

    const ttlMs = Math.max(nextState.resetAt - now, 1);
    await this.cacheManager.set(key, nextState, ttlMs);

    if (nextState.count > options.limit) {
      throw AppException.tooManyRequests(
        ErrorCode.TOO_MANY_REQUESTS,
        undefined,
        {
          retryAfterSeconds: Math.ceil(ttlMs / 1000),
          limit: options.limit,
        },
      );
    }

    return true;
  }
}
