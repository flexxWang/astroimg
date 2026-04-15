import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PresenceService } from './presence.service';
import { AppException, ErrorCode } from '@/common/exceptions';

type MessageGatewayJwtPayload = {
  sub: string;
};

type MessageSocketData = {
  userId?: string;
};

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie || '';
      const token = this.extractToken(cookie);
      if (!token) {
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
      if (state.changed) {
        void this.server.emit('presence:update', {
          userId,
          online: true,
        });
      }
    } catch {
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
    if (state.changed) {
      void this.server.emit('presence:update', {
        userId,
        online: false,
      });
    }
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
