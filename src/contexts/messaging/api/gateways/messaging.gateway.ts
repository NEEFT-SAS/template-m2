import { Inject, Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TOKEN_SERVICE, TokenPort } from '@/contexts/auth/app/ports/token.port';
import { MessagingRealtimeService } from '../../infra/realtime/messaging-realtime.service';

@Injectable()
@WebSocketGateway({
  namespace: 'messaging',
  cors: {
    origin: ['http://localhost:3000', 'https://neeft.fr', 'https://www.neeft.fr'],
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenPort,
    private readonly messagingRealtime: MessagingRealtimeService,
  ) {}

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    this.messagingRealtime.setServer(server);
  }

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      client.data.user = payload;
      client.join(this.messagingRealtime.profileRoom(payload.pid));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {}

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    const queryToken = typeof client.handshake.query?.token === 'string'
      ? client.handshake.query.token
      : null;
    const headerToken = this.parseAuthorizationHeader(client.handshake.headers?.authorization);

    const rawToken = String(authToken || queryToken || headerToken || '').trim();
    if (!rawToken) return null;

    if (rawToken.toLowerCase().startsWith('bearer ')) {
      const bearerToken = rawToken.slice(7).trim();
      return bearerToken || null;
    }

    return rawToken;
  }

  private parseAuthorizationHeader(value: string | string[] | undefined): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
  }
}
