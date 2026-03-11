import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class DeleteNotificationUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(requesterProfileId: string, notificationId: string) {
    return this.notificationsService.deleteNotification(
      requesterProfileId,
      notificationId,
    );
  }
}
