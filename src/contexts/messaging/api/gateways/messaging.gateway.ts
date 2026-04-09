import { ArgumentMetadata, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { StartConversationDto } from '@neeft-sas/shared';
import type {
  MessagingMarkConversationReadPresenter,
  MessagingMessagePresenter,
  MessagingStartConversationPresenter,
} from '@neeft-sas/shared';
import { Server, Socket } from 'socket.io';
import { TOKEN_SERVICE, TokenPort } from '@/contexts/auth/app/ports/token.port';
import { DomainError } from '@/core/errors/domain-error';
import { buildGlobalValidationPipe } from '@/core/http/validation/validation.pipe';
import { MarkConversationReadUseCase } from '../../app/usecases/mark-conversation-read.usecase';
import { SendConversationMessageUseCase } from '../../app/usecases/send-conversation-message.usecase';
import { StartConversationUseCase } from '../../app/usecases/start-conversation.usecase';
import { MarkConversationReadSocketDto, SendConversationMessageSocketDto } from '../dto/messaging-socket-command.dto';
import { MESSAGING_SOCKET_COMMANDS } from '../../domain/types/messaging.types';
import { MessagingRealtimeService } from '../../infra/realtime/messaging-realtime.service';

type JwtUser = {
  pid?: string;
  slug?: string;
};

@Injectable()
@WebSocketGateway({
  namespace: 'messaging',
  cors: {
    origin: ['http://localhost:3000', 'https://neeft.fr', 'https://www.neeft.fr'],
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly validationPipe = buildGlobalValidationPipe();

  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenPort,
    private readonly messagingRealtime: MessagingRealtimeService,
    private readonly startConversationUseCase: StartConversationUseCase,
    private readonly sendConversationMessageUseCase: SendConversationMessageUseCase,
    private readonly markConversationReadUseCase: MarkConversationReadUseCase,
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

  @SubscribeMessage(MESSAGING_SOCKET_COMMANDS.START_CONVERSATION)
  async subscribeStartConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<MessagingStartConversationPresenter> {
    return this.onStartConversation(client, payload);
  }

  @SubscribeMessage(MESSAGING_SOCKET_COMMANDS.SEND_MESSAGE)
  async subscribeSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): Promise<MessagingMessagePresenter> {
    return this.onSendMessage(client, payload);
  }

  @SubscribeMessage(MESSAGING_SOCKET_COMMANDS.MARK_CONVERSATION_READ)
  async subscribeMarkConversationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<MessagingMarkConversationReadPresenter> {
    return this.onMarkConversationRead(client, payload);
  }

  async onStartConversation(client: Socket, payload: unknown): Promise<MessagingStartConversationPresenter> {
    try {
      const body = await this.validatePayload(StartConversationDto, payload);
      return await this.startConversationUseCase.execute(this.getRequesterProfileId(client), body);
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  async onSendMessage(client: Socket, payload: unknown): Promise<MessagingMessagePresenter> {
    try {
      const body = await this.validatePayload(SendConversationMessageSocketDto, payload);
      return await this.sendConversationMessageUseCase.execute(this.getRequesterProfileId(client), body.conversationId, {
        content: body.content,
      });
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  async onMarkConversationRead(client: Socket, payload: unknown): Promise<MessagingMarkConversationReadPresenter> {
    try {
      const body = await this.validatePayload(MarkConversationReadSocketDto, payload);
      return await this.markConversationReadUseCase.execute(this.getRequesterProfileId(client), body.conversationId, {
        upToMessageId: body.upToMessageId,
      });
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    const queryToken = typeof client.handshake.query?.token === 'string' ? client.handshake.query.token : null;
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

  private getRequesterProfileId(client: Socket) {
    const profileId = (client.data.user as JwtUser | undefined)?.pid;
    if (!profileId) {
      throw new UnauthorizedException('Socket not authenticated');
    }

    return profileId;
  }

  private async validatePayload<T>(metatype: new (...args: any[]) => T, payload: unknown): Promise<T> {
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype,
      data: undefined,
    };

    return this.validationPipe.transform(payload, metadata) as Promise<T>;
  }

  private toWsException(error: unknown) {
    return new WsException(this.normalizeError(error));
  }

  private normalizeError(exception: unknown) {
    if (exception instanceof DomainError) {
      return {
        code: exception.code,
        message: exception.message,
        statusCode: exception.statusCode,
        fields: exception.fields,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const raw = exception.getResponse();
      const normalized = this.normalizeHttpException(raw, statusCode);

      return {
        statusCode,
        ...normalized,
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: (exception as any)?.message ?? 'Unexpected error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private normalizeHttpException(raw: any, statusCode: number) {
    if (raw && typeof raw === 'object') {
      const code = raw.code ?? this.defaultCodeForStatus(statusCode);
      const message = Array.isArray(raw.message) ? raw.message.join(', ') : String(raw.message ?? 'Request failed');

      return {
        code,
        message,
        fields: raw.fields,
        details: raw.details,
      };
    }

    if (typeof raw === 'string') {
      return {
        code: this.defaultCodeForStatus(statusCode),
        message: raw,
      };
    }

    return {
      code: this.defaultCodeForStatus(statusCode),
      message: 'Request failed',
    };
  }

  private defaultCodeForStatus(statusCode: number) {
    if (statusCode === 400) return 'BAD_REQUEST';
    if (statusCode === 401) return 'UNAUTHORIZED';
    if (statusCode === 403) return 'FORBIDDEN';
    if (statusCode === 404) return 'NOT_FOUND';
    if (statusCode === 409) return 'CONFLICT';
    if (statusCode === 422) return 'UNPROCESSABLE_ENTITY';
    if (statusCode === 429) return 'TOO_MANY_REQUESTS';
    return 'HTTP_ERROR';
  }
}
