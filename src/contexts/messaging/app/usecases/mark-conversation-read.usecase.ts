import { Injectable } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';

@Injectable()
export class MarkConversationReadUseCase {
  constructor(private readonly messagingService: MessagingService) {}

  execute(
    requesterProfileId: string,
    conversationId: string,
    payload: {
      upToMessageId?: string;
    },
  ) {
    return this.messagingService.markConversationRead(requesterProfileId, conversationId, payload);
  }
}
