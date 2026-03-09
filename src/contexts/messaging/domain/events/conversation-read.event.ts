import { DomainEvent } from '@/core/events/event-bus.port';

export const MESSAGING_CONVERSATION_READ_EVENT = 'messaging.conversation.read';

export type MessagingConversationReadPayload = {
  conversationId: string;
  readerProfileId: string;
  upToMessageId: string | null;
};

export class MessagingConversationReadEvent {
  static create(
    payload: MessagingConversationReadPayload,
  ): DomainEvent<MessagingConversationReadPayload> {
    return {
      name: MESSAGING_CONVERSATION_READ_EVENT,
      payload,
    };
  }
}
