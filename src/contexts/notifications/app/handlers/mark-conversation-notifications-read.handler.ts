import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MESSAGING_CONVERSATION_READ_EVENT,
  MessagingConversationReadPayload,
} from '@/contexts/messaging/domain/events/conversation-read.event';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class MarkConversationNotificationsReadHandler {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(MESSAGING_CONVERSATION_READ_EVENT)
  async handle(payload: MessagingConversationReadPayload): Promise<void> {
    await this.notificationsService.handleMessagingConversationRead(payload);
  }
}
