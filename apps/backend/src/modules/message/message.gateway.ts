import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PresenceService } from './presence.service';
import { AppException, ErrorCode } from '@/common/exceptions';
import { buildCorsOriginValidator } from '@/common/http/origin-allowlist';
import { AppLogger } from '@/common/logging/app-logger.service';
import { MetricsService } from '@/common/observability/metrics.service';

type MessageGatewayJwtPayload = {
  sub: string;
};

type MessageSocketData = {
  userId?: string;
};

@WebSocketGateway()
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly presenceService: PresenceService,
    private readonly logger: AppLogger,
    private readonly metricsService: MetricsService,
  ) {}

  afterInit(server: Server) {
    server.engine.opts.cors = {
      origin: buildCorsOriginValidator(
        this.configService.get<string[]>('app.corsAllowedOrigins') ?? [],
      ),
      credentials: true,
    };
  }

  async handleConnection(client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie || '';
      const token = this.extractToken(cookie);
      if (!token) {
        this.logger.warn('message.socket.missing_token', {
          socketId: client.id,
          origin: client.handshake.headers.origin,
        });
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<MessageGatewayJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });
      const userId = payload.sub;
      (client.data as MessageSocketData).userId = userId;
      void client.join(this.presenceService.roomForUser(userId));
      const state = await this.presenceService.addConnection(userId, client.id);
      this.metricsService.changeGauge('websocket_connections', 1);
      this.logger.event('message.socket.connected', {
        socketId: client.id,
        userId,
      });
      if (state.changed) {
        void this.server.emit('presence:update', {
          userId,
          online: true,
        });
      }
    } catch (error) {
      this.logger.error('message.socket.connection_failed', error, {
        socketId: client.id,
        origin: client.handshake.headers.origin,
      });
      void client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = (client.data as MessageSocketData).userId;
    if (!userId) return;
    const state = await this.presenceService.removeConnection(
      userId,
      client.id,
    );
    this.metricsService.changeGauge('websocket_connections', -1);
    if (state.changed) {
      void this.server.emit('presence:update', {
        userId,
        online: false,
      });
    }
    this.logger.event('message.socket.disconnected', {
      socketId: client.id,
      userId,
    });
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server
      .to(this.presenceService.roomForUser(userId))
      .emit(event, payload);
  }

  private extractToken(cookie: string) {
    const parts = cookie.split(';').map((c) => c.trim());
    for (const part of parts) {
      if (part.startsWith('access_token=')) {
        const encodedToken = part.split('=')[1];
        if (!encodedToken) {
          throw AppException.unauthorized(ErrorCode.UNAUTHORIZED);
        }
        return decodeURIComponent(encodedToken);
      }
    }
    return undefined;
  }
}
