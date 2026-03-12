import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly online = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie || '';
      const token = this.extractToken(cookie);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });
      const userId = payload.sub as string;
      client.data.userId = userId;
      if (!this.online.has(userId)) {
        this.online.set(userId, new Set());
      }
      this.online.get(userId)!.add(client.id);
      this.server.emit('presence:update', {
        userId,
        online: true,
      });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    const set = this.online.get(userId);
    if (!set) return;
    set.delete(client.id);
    if (set.size === 0) {
      this.online.delete(userId);
      this.server.emit('presence:update', {
        userId,
        online: false,
      });
    }
  }

  emitToUser(userId: string, event: string, payload: any) {
    const sockets = this.online.get(userId);
    if (!sockets) return;
    sockets.forEach((id) => {
      this.server.to(id).emit(event, payload);
    });
  }

  isOnline(userId: string) {
    return this.online.has(userId);
  }

  private extractToken(cookie: string) {
    const parts = cookie.split(';').map((c) => c.trim());
    for (const part of parts) {
      if (part.startsWith('access_token=')) {
        return decodeURIComponent(part.split('=')[1]);
      }
    }
    return undefined;
  }
}
