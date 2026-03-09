import { DomainEvent } from '@/core/events/event-bus.port';
import { MessagingMessageSenderType } from '../types/messaging.types';

export const MESSAGING_MESSAGE_SENT_EVENT = 'messaging.message.sent';

export type MessagingMessageSentPayload = {
  conversationId: string;
  messageId: string;
  senderType: MessagingMessageSenderType;
  senderProfileId: string | null;
  senderSystemKey: string | null;
  recipientProfileIds: string[];
  preview: string;
  createdAt: string;
};

export class MessagingMessageSentEvent {
  static create(
    payload: MessagingMessageSentPayload,
  ): DomainEvent<MessagingMessageSentPayload> {
    return {
      name: MESSAGING_MESSAGE_SENT_EVENT,
      payload,
    };
  }
}
