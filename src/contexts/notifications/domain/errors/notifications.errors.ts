import { DomainError } from '@/core/errors/domain-error';
import { NotificationFilter } from '../types/notification.types';

export class NotificationNotFoundError extends DomainError {
  constructor(notificationId: string) {
    super({
      code: 'NOTIFICATION_NOT_FOUND',
      message: 'Notification not found',
      statusCode: 404,
      fields: { notificationId: ['not_found'] },
      details: { notificationId },
    });
  }
}

export class NotificationInvalidFilterError extends DomainError {
  constructor(filter: string | null | undefined) {
    super({
      code: 'NOTIFICATION_INVALID_FILTER',
      message: 'Invalid notification filter',
      statusCode: 400,
      fields: { filter: ['invalid'] },
      details: {
        filter: filter ?? null,
        allowedFilters: ['ALL', 'UNREAD'] satisfies NotificationFilter[],
      },
    });
  }
}
