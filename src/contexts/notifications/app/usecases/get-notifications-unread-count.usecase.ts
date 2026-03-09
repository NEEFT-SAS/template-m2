import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class GetNotificationsUnreadCountUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(requesterProfileId: string) {
    return this.notificationsService.getUnreadCount(requesterProfileId);
  }
}
