export const MESSAGING_ENTITY_TYPES = ['PLAYER', 'TEAM'] as const;
export type MessagingEntityType = (typeof MESSAGING_ENTITY_TYPES)[number];

export const MESSAGING_SCOPES = ['SELF', 'TEAM'] as const;
export type MessagingScope = (typeof MESSAGING_SCOPES)[number];

export type MessagingActor = {
  id: string;
  type: MessagingEntityType;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MessagingTeamContext = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MessagingConversationSummary = {
  id: string;
  scope: MessagingScope;
  context: MessagingActor;
  counterpart: MessagingActor;
  unreadCount: number;
  lastMessage: {
    preview: string;
    senderProfileId: string | null;
    createdAt: string | null;
  } | null;
};

export type MessagingMessagePresenter = {
  id: string;
  conversationId: string;
  senderProfileId: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  deliveryStatus: 'READ' | 'UNREAD' | null;
  readByCount: number;
  recipientCount: number;
};

export const MESSAGING_SOCKET_EVENTS = {
  MESSAGE_CREATED: 'messaging.message.created',
  CONVERSATION_UPDATED: 'messaging.conversation.updated',
  CONVERSATION_READ: 'messaging.conversation.read',
  UNREAD_COUNT_UPDATED: 'messaging.unread-count.updated',
} as const;
