import { NotificationType } from '../../domain/types/notification.types';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export type NotificationProfileSnapshot = {
  id: string;
  username: string;
  slug: string;
  profilePicture: string | null;
};

export type NotificationRecord = {
  id: string;
  recipientProfileId: string;
  actorProfileId: string | null;
  type: NotificationType;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  contextConversationId: string | null;
  contextMessageId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationListItemRecord = NotificationRecord & {
  actorUsername: string | null;
  actorSlug: string | null;
  actorProfilePicture: string | null;
};

export type NotificationsListResult = {
  items: NotificationListItemRecord[];
  total: number;
};

export interface NotificationsRepositoryPort {
  listForRecipient(
    recipientProfileId: string,
    onlyUnread: boolean,
    limit: number,
    offset: number,
  ): Promise<NotificationsListResult>;
  countUnreadForRecipient(recipientProfileId: string): Promise<number>;
  findByIdForRecipient(
    notificationId: string,
    recipientProfileId: string,
  ): Promise<NotificationListItemRecord | null>;
  createMany(
    notifications: Array<{
      recipientProfileId: string;
      actorProfileId: string | null;
      type: NotificationType;
      title: string | null;
      body: string | null;
      payload: Record<string, unknown> | null;
      contextConversationId: string | null;
      contextMessageId: string | null;
    }>,
  ): Promise<NotificationRecord[]>;
  markAsRead(
    notificationId: string,
    recipientProfileId: string,
  ): Promise<boolean>;
  deleteByIdForRecipient(
    notificationId: string,
    recipientProfileId: string,
  ): Promise<boolean>;
  markAllAsRead(recipientProfileId: string): Promise<number>;
  markMessageNotificationsAsReadForConversation(
    recipientProfileId: string,
    conversationId: string,
  ): Promise<number>;
  findProfileSnapshotById(
    profileId: string,
  ): Promise<NotificationProfileSnapshot | null>;
}
