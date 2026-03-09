import { Injectable } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';

@Injectable()
export class GetConversationMessagesUseCase {
  constructor(private readonly messagingService: MessagingService) {}

  execute(
    requesterProfileId: string,
    conversationId: string,
    query: {
      limit?: number;
      beforeMessageId?: string;
    },
  ) {
    return this.messagingService.getConversationMessages(requesterProfileId, conversationId, query);
  }
}
