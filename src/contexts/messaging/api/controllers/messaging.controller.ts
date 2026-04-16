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
import {
  GetConversationMessagesQueryDto,
  GetConversationsQueryDto,
  MarkConversationReadDto,
  SendConversationMessageDto,
  StartConversationDto,
} from '@neeft-sas/shared';
import { GetConversationsUseCase } from '../../app/usecases/get-conversations.usecase';
import { GetConversationMessagesUseCase } from '../../app/usecases/get-conversation-messages.usecase';
import { GetUnreadCountUseCase } from '../../app/usecases/get-unread-count.usecase';
import { GetTeamContextsUseCase } from '../../app/usecases/get-team-contexts.usecase';
import { StartConversationUseCase } from '../../app/usecases/start-conversation.usecase';
import { SendConversationMessageUseCase } from '../../app/usecases/send-conversation-message.usecase';
import { MarkConversationReadUseCase } from '../../app/usecases/mark-conversation-read.usecase';

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
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly getTeamContextsUseCase: GetTeamContextsUseCase,
    private readonly startConversationUseCase: StartConversationUseCase,
    private readonly sendConversationMessageUseCase: SendConversationMessageUseCase,
    private readonly markConversationReadUseCase: MarkConversationReadUseCase,
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
  getConversations(
    @Req() req: RequestWithUser,
    @Query() query: GetConversationsQueryDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getConversationsUseCase.execute(requesterProfileId, query);
  }

  @Get('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  getConversationMessages(
    @Req() req: RequestWithUser,
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationMessagesQueryDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getConversationMessagesUseCase.execute(
      requesterProfileId,
      conversationId,
      query,
    );
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  startConversation(
    @Req() req: RequestWithUser,
    @Body() body: StartConversationDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.startConversationUseCase.execute(requesterProfileId, body);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.CREATED)
  sendConversationMessage(
    @Req() req: RequestWithUser,
    @Param('conversationId') conversationId: string,
    @Body() body: SendConversationMessageDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.sendConversationMessageUseCase.execute(
      requesterProfileId,
      conversationId,
      body,
    );
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  markConversationRead(
    @Req() req: RequestWithUser,
    @Param('conversationId') conversationId: string,
    @Body() body: MarkConversationReadDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.markConversationReadUseCase.execute(
      requesterProfileId,
      conversationId,
      body,
    );
  }
}
