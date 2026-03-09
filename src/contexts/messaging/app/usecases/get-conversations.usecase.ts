import { Injectable } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';

@Injectable()
export class GetConversationsUseCase {
  constructor(private readonly messagingService: MessagingService) {}

  execute(
    requesterProfileId: string,
    query: {
      scope?: string;
      teamId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.messagingService.getConversations(requesterProfileId, query);
  }
}
