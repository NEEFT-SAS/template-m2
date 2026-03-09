import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { GetConversationsUseCase } from '../../app/usecases/get-conversations.usecase';
import { GetConversationMessagesUseCase } from '../../app/usecases/get-conversation-messages.usecase';
import { SendConversationMessageUseCase } from '../../app/usecases/send-conversation-message.usecase';
import { MarkConversationReadUseCase } from '../../app/usecases/mark-conversation-read.usecase';
import { GetUnreadCountUseCase } from '../../app/usecases/get-unread-count.usecase';
import { GetTeamContextsUseCase } from '../../app/usecases/get-team-contexts.usecase';
import { StartConversationUseCase } from '../../app/usecases/start-conversation.usecase';
import { GetConversationsQueryDto } from '../dtos/get-conversations.query.dto';
import { GetConversationMessagesQueryDto } from '../dtos/get-conversation-messages.query.dto';
import { SendConversationMessageDto } from '../dtos/send-conversation-message.dto';
import { MarkConversationReadDto } from '../dtos/mark-conversation-read.dto';
import { StartConversationDto } from '../dtos/start-conversation.dto';

type JwtUser = {
  pid?: string;
  slug?: string;
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('messaging')
@UseGuards(ConnectedGuard)
export class MessagingController {
  constructor(
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
    private readonly sendConversationMessageUseCase: SendConversationMessageUseCase,
    private readonly markConversationReadUseCase: MarkConversationReadUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly getTeamContextsUseCase: GetTeamContextsUseCase,
    private readonly startConversationUseCase: StartConversationUseCase,
  ) {}

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  getUnreadCount(@Req() req: RequestWithUser) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getUnreadCountUseCase.execute(requesterProfileId);
  }

  @Get('team-contexts')
  @HttpCode(HttpStatus.OK)
  getTeamContexts(@Req() req: RequestWithUser) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getTeamContextsUseCase.execute(requesterProfileId);
  }

  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  getConversations(@Req() req: RequestWithUser, @Query() query: GetConversationsQueryDto) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getConversationsUseCase.execute(requesterProfileId, query);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  startConversation(@Req() req: RequestWithUser, @Body() body: StartConversationDto) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.startConversationUseCase.execute(requesterProfileId, body);
  }

  @Get('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  getConversationMessages(
    @Req() req: RequestWithUser,
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationMessagesQueryDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getConversationMessagesUseCase.execute(requesterProfileId, conversationId, query);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  sendConversationMessage(
    @Req() req: RequestWithUser,
    @Param('conversationId') conversationId: string,
    @Body() body: SendConversationMessageDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.sendConversationMessageUseCase.execute(requesterProfileId, conversationId, body);
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  markConversationRead(
    @Req() req: RequestWithUser,
    @Param('conversationId') conversationId: string,
    @Body() body: MarkConversationReadDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.markConversationReadUseCase.execute(requesterProfileId, conversationId, body ?? {});
  }
}
