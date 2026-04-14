import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { UploadService } from '../upload/upload.service';

type DependencyStatus = {
  status: 'up' | 'down';
  latencyMs?: number;
  details?: Record<string, unknown>;
  error?: string;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
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
      database: await this.runCheck(() => this.checkDatabase(), timeoutMs),
      cache: await this.runCheck(() => this.checkCache(), timeoutMs),
      storage: await this.runCheck(() => this.checkStorage(), timeoutMs),
    };
    const isReady = Object.values(checks).every(
      (item) => item.status === 'up',
    );

    return {
      status: isReady ? 'ok' : 'degraded',
      dependencies: checks,
      timestamp: new Date().toISOString(),
    };
  }

  private async runCheck(
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

      return {
        status: 'up',
        latencyMs: Date.now() - startedAt,
        details: result ?? undefined,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown error',
      };
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
    const key = `health:${Date.now()}`;
    await this.cacheManager.set(key, 'ok', 5_000);
    const value = await this.cacheManager.get<string>(key);
    if (value !== 'ok') {
      throw new Error('cache roundtrip failed');
    }
  }

  private async checkStorage() {
    return this.uploadService.checkHealth();
  }
}
