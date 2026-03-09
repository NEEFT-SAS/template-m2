import { Injectable } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';

@Injectable()
export class SendConversationMessageUseCase {
  constructor(private readonly messagingService: MessagingService) {}

  execute(
    requesterProfileId: string,
    conversationId: string,
    payload: {
      content: string;
    },
  ) {
    return this.messagingService.sendMessage(requesterProfileId, conversationId, payload);
  }
}
