import { Injectable } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';

@Injectable()
export class StartConversationUseCase {
  constructor(private readonly messagingService: MessagingService) {}

  execute(
    requesterProfileId: string,
    payload: {
      scope?: string;
      contextTeamId?: string;
      targetType: string;
      targetId?: string;
      targetSlug?: string;
      content: string;
    },
  ) {
    return this.messagingService.startConversation(requesterProfileId, payload);
  }
}
