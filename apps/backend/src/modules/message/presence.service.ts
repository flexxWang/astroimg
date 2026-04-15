import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createClient, type RedisClientType } from 'redis';
import { AppLogger } from '@/common/logging/app-logger.service';

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly online = new Map<string, Set<string>>();
  private readonly instanceId = randomUUID();
  private redisClient?: RedisClientType;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit() {
    const host = this.configService.getOrThrow<string>('redis.host');
    const port = this.configService.getOrThrow<number>('redis.port');
    const password = this.configService.get<string | undefined>(
      'redis.password',
    );
    const database = this.configService.getOrThrow<number>('redis.db');

    this.redisClient = createClient({
      socket: { host, port },
      password,
      database,
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('presence.redis.error', error);
    });

    await this.redisClient.connect();
  }

  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.cleanupInstancePresence();
      await this.redisClient.quit();
    }
  }

  roomForUser(userId: string) {
    return `user:${userId}`;
  }

  async addConnection(userId: string, socketId: string) {
    const sockets = this.online.get(userId) ?? new Set<string>();
    const wasOnline = sockets.size > 0;
    sockets.add(socketId);
    this.online.set(userId, sockets);

    let changed = !wasOnline;
    if (this.redisClient?.isOpen) {
      const key = this.presenceKey(userId);
      const member = this.presenceMember(socketId);
      await this.redisClient.sAdd(key, member);
      const total = await this.redisClient.sCard(key);
      changed = total === 1;
    }

    return {
      userId,
      changed,
      online: true,
    };
  }

  async removeConnection(userId: string, socketId: string) {
    const sockets = this.online.get(userId);
    if (!sockets) {
      return {
        userId,
        changed: false,
        online: false,
      };
    }

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.online.delete(userId);
    }

    let changed = sockets.size === 0;
    if (this.redisClient?.isOpen) {
      const key = this.presenceKey(userId);
      await this.redisClient.sRem(key, this.presenceMember(socketId));
      const total = await this.redisClient.sCard(key);
      if (total === 0) {
        await this.redisClient.del(key);
      }
      changed = total === 0;
    }

    return {
      userId,
      changed,
      online: !changed,
    };
  }

  getSockets(userId: string) {
    return this.online.get(userId);
  }

  async isOnline(userId: string) {
    if (this.redisClient?.isOpen) {
      return (await this.redisClient.sCard(this.presenceKey(userId))) > 0;
    }

    return this.online.has(userId);
  }

  private presenceKey(userId: string) {
    return `presence:user:${userId}`;
  }

  private presenceMember(socketId: string) {
    return `${this.instanceId}:${socketId}`;
  }

  private async cleanupInstancePresence() {
    for (const [userId, sockets] of this.online.entries()) {
      if (sockets.size === 0) {
        continue;
      }

      const key = this.presenceKey(userId);
      const members = Array.from(sockets).map((socketId) =>
        this.presenceMember(socketId),
      );
      if (members.length > 0) {
        await this.redisClient?.sRem(key, members);
      }
      const total = await this.redisClient?.sCard(key);
      if (total === 0) {
        await this.redisClient?.del(key);
      }
    }
  }
}
