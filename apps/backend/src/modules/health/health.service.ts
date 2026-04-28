import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { MetricsService } from '@/common/observability/metrics.service';
import { UploadService } from '../upload/upload.service';

type DependencyStatus = {
  status: 'up' | 'down';
  latencyMs?: number;
  details?: Record<string, unknown>;
  error?: string;
};

type CacheClient = {
  isReady?: boolean;
};

type CacheStoreClient = {
  getClient: () => Promise<CacheClient>;
};

type CacheKeyvStore = {
  store: CacheStoreClient;
};

type CacheManagerWithStores = Cache & {
  ttl?: (key: string) => Promise<number>;
  del?: (key: string) => Promise<void> | void;
};

function isCacheKeyvStore(value: unknown): value is CacheKeyvStore {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const store = (value as { store?: unknown }).store;
  if (!store || typeof store !== 'object') {
    return false;
  }

  return typeof (store as { getClient?: unknown }).getClient === 'function';
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {}

  live() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const timeoutMs =
      this.configService.get<number>('app.healthcheckTimeoutMs') ?? 1_500;
    const checks = {
      database: await this.runCheck(
        'database',
        () => this.checkDatabase(),
        timeoutMs,
      ),
      cache: await this.runCheck('cache', () => this.checkCache(), timeoutMs),
      storage: await this.runCheck(
        'storage',
        () => this.checkStorage(),
        timeoutMs,
      ),
    };
    const isReady = Object.values(checks).every((item) => item.status === 'up');

    return {
      status: isReady ? 'ok' : 'degraded',
      dependencies: checks,
      timestamp: new Date().toISOString(),
    };
  }

  private async runCheck(
    dependency: 'database' | 'cache' | 'storage',
    runner: () => Promise<Record<string, unknown> | void>,
    timeoutMs: number,
  ): Promise<DependencyStatus> {
    const startedAt = Date.now();
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const result = await Promise.race([
        runner(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
        }),
      ]);

      const status: DependencyStatus = {
        status: 'up',
        latencyMs: Date.now() - startedAt,
        details: result ?? undefined,
      };
      this.metricsService.recordDependencyHealth(
        dependency,
        status.latencyMs ?? 0,
        status.status,
      );
      return status;
    } catch (error) {
      const status: DependencyStatus = {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown error',
      };
      this.metricsService.recordDependencyHealth(
        dependency,
        status.latencyMs ?? 0,
        status.status,
      );
      return status;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async checkDatabase() {
    await this.dataSource.query('SELECT 1');
  }

  private async checkCache() {
    const cache = this.cacheManager as unknown as CacheManagerWithStores;
    const redisClient = await this.getRedisCacheClient();

    if (!redisClient) {
      throw new Error('cache is not backed by a redis adapter');
    }

    if (redisClient.isReady === false) {
      throw new Error('redis cache client is not ready');
    }

    const key = `health:${Date.now()}`;
    await cache.set(key, 'ok', 5_000);
    const value = await cache.get<string>(key);
    if (value !== 'ok') {
      throw new Error('cache roundtrip failed');
    }

    const ttlMs = await cache.ttl?.(key);
    if (typeof ttlMs !== 'number' || ttlMs <= 0 || ttlMs > 5_000) {
      throw new Error('cache ttl check failed');
    }

    await cache.del?.(key);
    const deletedValue = await cache.get<string>(key);
    if (deletedValue !== undefined) {
      throw new Error('cache delete check failed');
    }

    return {
      ttlMs,
      clientReady: redisClient.isReady ?? true,
    };
  }

  private getRedisCacheClient(): Promise<CacheClient | null> {
    const stores = (
      this.cacheManager as unknown as {
        stores?: unknown[];
      }
    ).stores;
    const primaryStore = stores?.[0];

    if (!isCacheKeyvStore(primaryStore)) {
      return Promise.resolve(null);
    }

    return primaryStore.store.getClient();
  }

  private async checkStorage() {
    return this.uploadService.checkHealth();
  }
}
