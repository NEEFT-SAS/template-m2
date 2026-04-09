import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import {
  GetConversationMessagesQueryDto,
  GetConversationsQueryDto,
} from '@neeft-sas/shared';
import { GetConversationsUseCase } from '../../app/usecases/get-conversations.usecase';
import { GetConversationMessagesUseCase } from '../../app/usecases/get-conversation-messages.usecase';
import { GetUnreadCountUseCase } from '../../app/usecases/get-unread-count.usecase';
import { GetTeamContextsUseCase } from '../../app/usecases/get-team-contexts.usecase';

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
}
