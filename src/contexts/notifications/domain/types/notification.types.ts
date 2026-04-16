export const NOTIFICATION_TYPES = [
  'MESSAGING_MESSAGE_RECEIVED',
  'RECRUITMENT_APPLICATION_RECEIVED',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_FILTERS = ['ALL', 'UNREAD'] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

export type NotificationActorPresenter = {
  id: string;
  username: string;
  slug: string;
  profilePicture: string | null;
};

export type NotificationPresenter = {
  id: string;
  type: NotificationType;
  title: string | null;
  body: string | null;
  payload: Record<string, unknown> | null;
  contextConversationId: string | null;
  contextMessageId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActorPresenter | null;
};

export const NOTIFICATIONS_SOCKET_EVENTS = {
  CREATED: 'notifications.created',
  READ: 'notifications.read',
  DELETED: 'notifications.deleted',
  UNREAD_COUNT_UPDATED: 'notifications.unread-count.updated',
} as const;
