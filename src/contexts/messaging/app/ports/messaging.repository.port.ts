import {
  MessagingEntityType,
  MessagingMessageSenderType,
} from '../../domain/types/messaging.types';

export const MESSAGING_REPOSITORY = Symbol('MESSAGING_REPOSITORY');

export type MessagingConversationRecord = {
  id: string;
  conversationKey: string;
  participantAType: MessagingEntityType;
  participantAPlayerId: string | null;
  participantATeamId: string | null;
  participantBType: MessagingEntityType;
  participantBPlayerId: string | null;
  participantBTeamId: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderType: MessagingMessageSenderType | null;
  lastMessageSenderProfileId: string | null;
  lastMessageSenderSystemKey: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MessagingConversationListItem = MessagingConversationRecord & {
  unreadCount: number;
};

export type MessagingConversationListResult = {
  items: MessagingConversationListItem[];
  total: number;
};

export type MessagingMessageRecord = {
  id: string;
  conversationId: string;
  senderType: MessagingMessageSenderType;
  senderProfileId: string | null;
  senderSystemKey: string | null;
  content: string;
  createdAt: Date;
  readByCount: number;
};

export type MessagingMessageSender = {
  type: MessagingMessageSenderType;
  profileId: string | null;
  systemKey: string | null;
};

export type MessagingMessagePageResult = {
  items: MessagingMessageRecord[];
  hasMore: boolean;
  nextBeforeMessageId: string | null;
};

export type MessagingMarkReadResult = {
  upToMessageId: string | null;
  markedCount: number;
};

export interface MessagingRepositoryPort {
  findConversationById(conversationId: string): Promise<MessagingConversationRecord | null>;
  findConversationByKey(conversationKey: string): Promise<MessagingConversationRecord | null>;
  createConversation(params: {
    conversationKey: string;
    participantAType: MessagingEntityType;
    participantAPlayerId: string | null;
    participantATeamId: string | null;
    participantBType: MessagingEntityType;
    participantBPlayerId: string | null;
    participantBTeamId: string | null;
  }): Promise<MessagingConversationRecord>;
  touchConversationLastMessage(
    conversationId: string,
    preview: string,
    sender: MessagingMessageSender,
    createdAt: Date,
  ): Promise<void>;
  listConversationsForPlayer(
    profileId: string,
    viewerProfileId: string,
    limit: number,
    offset: number,
  ): Promise<MessagingConversationListResult>;
  listConversationsForTeams(
    teamIds: string[],
    viewerProfileId: string,
    limit: number,
    offset: number,
  ): Promise<MessagingConversationListResult>;
  listMessages(
    conversationId: string,
    limit: number,
    beforeMessageId?: string | null,
  ): Promise<MessagingMessagePageResult>;
  createMessage(
    conversationId: string,
    sender: MessagingMessageSender,
    content: string,
  ): Promise<MessagingMessageRecord>;
  markConversationAsRead(
    conversationId: string,
    readerProfileId: string,
    upToMessageId?: string | null,
  ): Promise<MessagingMarkReadResult>;
  countUnreadForConversation(conversationId: string, viewerProfileId: string): Promise<number>;
  countUnreadForViewer(viewerProfileId: string, teamIds: string[]): Promise<number>;
  getFirstUnreadMessageId(conversationId: string, viewerProfileId: string): Promise<string | null>;
}
