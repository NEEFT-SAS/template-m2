import { Injectable } from '@nestjs/common';
import { MessagingService } from '../services/messaging.service';

@Injectable()
export class GetUnreadCountUseCase {
  constructor(private readonly messagingService: MessagingService) {}

  execute(requesterProfileId: string) {
    return this.messagingService.getUnreadCount(requesterProfileId);
  }
}
