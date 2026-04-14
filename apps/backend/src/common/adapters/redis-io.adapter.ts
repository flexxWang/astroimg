import { Logger } from '@nestjs/common';
import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import type { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: RedisClientType;
  private subClient?: RedisClientType;

  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis() {
    const configService = this.app.get(ConfigService);
    const host = configService.getOrThrow<string>('redis.host');
    const port = configService.getOrThrow<number>('redis.port');
    const password = configService.get<string | undefined>('redis.password');
    const database = configService.getOrThrow<number>('redis.db');

    const options = {
      socket: { host, port },
      password,
      database,
    };

    this.pubClient = createClient(options);
    this.subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    this.logger.log(
      `Socket.IO Redis adapter connected to ${host}:${port}/${database}`,
    );
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }

  async close() {
    await Promise.all([this.pubClient?.quit(), this.subClient?.quit()]);
  }
}
