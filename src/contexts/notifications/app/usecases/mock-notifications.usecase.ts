import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class MockNotificationsUseCase {
  constructor(private readonly notificationsService: NotificationsService) {}

  execute(requesterProfileId: string, input: { count?: number }) {
    return this.notificationsService.mockNotifications(requesterProfileId, input);
  }
}
