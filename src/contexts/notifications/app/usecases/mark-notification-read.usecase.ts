import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(requesterProfileId: string, notificationId: string) {
    return this.notificationsService.markNotificationRead(
      requesterProfileId,
      notificationId,
    );
  }
}
