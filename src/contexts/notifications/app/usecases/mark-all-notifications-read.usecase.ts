import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(requesterProfileId: string) {
    return this.notificationsService.markAllNotificationsRead(
      requesterProfileId,
    );
  }
}
