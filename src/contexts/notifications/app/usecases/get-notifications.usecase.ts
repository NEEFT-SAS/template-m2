import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class GetNotificationsUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(
    requesterProfileId: string,
    query: {
      filter?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.notificationsService.getNotifications(
      requesterProfileId,
      query,
    );
  }
}
