import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MESSAGING_MESSAGE_SENT_EVENT,
  MessagingMessageSentPayload,
} from '@/contexts/messaging/domain/events/message-sent.event';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class CreateMessageReceivedNotificationHandler {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(MESSAGING_MESSAGE_SENT_EVENT)
  async handle(payload: MessagingMessageSentPayload): Promise<void> {
    await this.notificationsService.handleMessagingMessageSent(payload);
  }
}
