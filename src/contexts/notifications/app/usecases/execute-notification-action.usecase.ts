import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class ExecuteNotificationActionUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(requesterProfileId: string, notificationId: string, actionKey: string) {
    return this.notificationsService.executeNotificationAction(
      requesterProfileId,
      notificationId,
      actionKey,
    );
  }
}
