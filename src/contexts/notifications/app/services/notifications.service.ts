import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  NOTIFICATIONS_REPOSITORY,
  NotificationsRepositoryPort,
} from '../ports/notifications.repository.port';
import {
  NotificationFilter,
  NotificationPresenter,
  NOTIFICATION_FILTERS,
  NOTIFICATIONS_SOCKET_EVENTS,
} from '../../domain/types/notification.types';
import {
  NotificationInvalidFilterError,
  NotificationNotFoundError,
} from '../../domain/errors/notifications.errors';
import { NotificationsRealtimeService } from '../../infra/realtime/notifications-realtime.service';
import { MessagingMessageSentPayload } from '@/contexts/messaging/domain/events/message-sent.event';
import { MessagingConversationReadPayload } from '@/contexts/messaging/domain/events/conversation-read.event';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepo: NotificationsRepositoryPort,
    private readonly notificationsRealtime: NotificationsRealtimeService,
  ) {}

  async getNotifications(
    requesterProfileId: string,
    query: {
      filter?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const filter = this.resolveFilter(query.filter);
    const onlyUnread = filter === 'UNREAD';
    const limit = this.resolveLimit(query.limit, 20, 1, 100);
    const offset = this.resolveOffset(query.offset);

    const [rows, unreadCount] = await Promise.all([
      this.notificationsRepo.listForRecipient(
        requesterProfileId,
        onlyUnread,
        limit,
        offset,
      ),
      this.notificationsRepo.countUnreadForRecipient(requesterProfileId),
    ]);

    return {
      items: rows.items.map((row) => this.toPresenter(row)),
      total: rows.total,
      unreadCount,
      limit,
      offset,
    };
  }

  async getUnreadCount(requesterProfileId: string) {
    const unreadCount =
      await this.notificationsRepo.countUnreadForRecipient(requesterProfileId);
    return { unreadCount };
  }

  async markNotificationRead(
    requesterProfileId: string,
    notificationId: string,
  ) {
    const existing = await this.notificationsRepo.findByIdForRecipient(
      notificationId,
      requesterProfileId,
    );
    if (!existing) {
      throw new NotificationNotFoundError(notificationId);
    }

    const marked = await this.notificationsRepo.markAsRead(
      notificationId,
      requesterProfileId,
    );
    const unreadCount =
      await this.notificationsRepo.countUnreadForRecipient(requesterProfileId);

    if (marked) {
      this.notificationsRealtime.emitToProfile(
        requesterProfileId,
        NOTIFICATIONS_SOCKET_EVENTS.READ,
        {
          notificationIds: [notificationId],
          all: false,
        },
      );
    }

    this.notificationsRealtime.emitToProfile(
      requesterProfileId,
      NOTIFICATIONS_SOCKET_EVENTS.UNREAD_COUNT_UPDATED,
      { unreadCount },
    );

    return {
      notificationId,
      marked,
      unreadCount,
    };
  }

  async markAllNotificationsRead(requesterProfileId: string) {
    const markedCount =
      await this.notificationsRepo.markAllAsRead(requesterProfileId);
    const unreadCount =
      await this.notificationsRepo.countUnreadForRecipient(requesterProfileId);

    if (markedCount > 0) {
      this.notificationsRealtime.emitToProfile(
        requesterProfileId,
        NOTIFICATIONS_SOCKET_EVENTS.READ,
        {
          notificationIds: [],
          all: true,
        },
      );
    }

    this.notificationsRealtime.emitToProfile(
      requesterProfileId,
      NOTIFICATIONS_SOCKET_EVENTS.UNREAD_COUNT_UPDATED,
      { unreadCount },
    );

    return {
      markedCount,
      unreadCount,
    };
  }

  async mockNotifications(
    requesterProfileId: string,
    input: {
      count?: number;
    },
  ) {
    const count = this.resolveLimit(input.count, 24, 1, 200);
    const actor = await this.notificationsRepo.findProfileSnapshotById(
      requesterProfileId,
    );

    const templates = [
      {
        title: 'Nouveau message recu',
        body: 'Un joueur vous a envoye un message a propos de votre profil.',
      },
      {
        title: 'Nouveau contact',
        body: 'Une equipe souhaite echanger avec vous.',
      },
      {
        title: 'Message d equipe',
        body: 'Un membre staff vous a contacte depuis le contexte equipe.',
      },
      {
        title: 'Relance de conversation',
        body: 'Vous avez recu une relance sur une conversation recente.',
      },
      {
        title: 'Message prioritaire',
        body: 'Un nouveau message requiert votre attention.',
      },
      {
        title: 'Mise a jour de discussion',
        body: 'Un message est arrive pendant votre navigation.',
      },
    ] as const;

    const created = await this.notificationsRepo.createMany(
      Array.from({ length: count }, (_, index) => {
        const template = templates[index % templates.length];
        const contextConversationId = randomUUID();
        const contextMessageId = randomUUID();

        return {
          recipientProfileId: requesterProfileId,
          actorProfileId: requesterProfileId,
          type: 'MESSAGING_MESSAGE_RECEIVED' as const,
          title: template.title,
          body: template.body,
          payload: {
            mock: true,
            index: index + 1,
            conversationId: contextConversationId,
            messageId: contextMessageId,
          },
          contextConversationId,
          contextMessageId,
        };
      }),
    );

    const readIds = new Set(
      created
        .filter((_, index) => index % 3 === 2)
        .map((notification) => notification.id),
    );

    await Promise.all(
      Array.from(readIds).map((notificationId) =>
        this.notificationsRepo.markAsRead(notificationId, requesterProfileId),
      ),
    );

    const unreadCount = await this.notificationsRepo.countUnreadForRecipient(
      requesterProfileId,
    );

    const nowIso = new Date().toISOString();
    const items = created.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      payload: notification.payload,
      contextConversationId: notification.contextConversationId,
      contextMessageId: notification.contextMessageId,
      readAt: readIds.has(notification.id) ? nowIso : null,
      createdAt: notification.createdAt.toISOString(),
      actor: actor
        ? {
            id: actor.id,
            username: actor.username,
            slug: actor.slug,
            profilePicture: actor.profilePicture,
          }
        : null,
    }));

    this.notificationsRealtime.emitToProfile(
      requesterProfileId,
      NOTIFICATIONS_SOCKET_EVENTS.CREATED,
      { items },
    );

    this.notificationsRealtime.emitToProfile(
      requesterProfileId,
      NOTIFICATIONS_SOCKET_EVENTS.UNREAD_COUNT_UPDATED,
      { unreadCount },
    );

    return {
      createdCount: created.length,
      unreadCount,
      items,
    };
  }

  async handleMessagingMessageSent(payload: MessagingMessageSentPayload) {
    const recipientProfileIds = Array.from(
      new Set(
        payload.recipientProfileIds.filter(
          (profileId) => profileId && profileId !== payload.senderProfileId,
        ),
      ),
    );
    if (!recipientProfileIds.length) return;

    const sender = await this.notificationsRepo.findProfileSnapshotById(
      payload.senderProfileId,
    );
    const senderLabel = sender?.username ?? 'Utilisateur';
    const body = payload.preview || 'Vous avez reçu un nouveau message.';

    const created = await this.notificationsRepo.createMany(
      recipientProfileIds.map((recipientProfileId) => ({
        recipientProfileId,
        actorProfileId: payload.senderProfileId,
        type: 'MESSAGING_MESSAGE_RECEIVED',
        title: `Nouveau message de ${senderLabel}`,
        body,
        payload: {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
        },
        contextConversationId: payload.conversationId,
        contextMessageId: payload.messageId,
      })),
    );

    const createdByRecipient = new Map<string, NotificationPresenter[]>();
    created.forEach((item) => {
      const list = createdByRecipient.get(item.recipientProfileId) ?? [];
      list.push({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        payload: item.payload,
        contextConversationId: item.contextConversationId,
        contextMessageId: item.contextMessageId,
        readAt: item.readAt ? item.readAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
        actor: sender
          ? {
              id: sender.id,
              username: sender.username,
              slug: sender.slug,
              profilePicture: sender.profilePicture,
            }
          : null,
      });
      createdByRecipient.set(item.recipientProfileId, list);
    });

    await Promise.all(
      Array.from(createdByRecipient.entries()).map(
        async ([recipientProfileId, notifications]) => {
          const unreadCount =
            await this.notificationsRepo.countUnreadForRecipient(
              recipientProfileId,
            );

          this.notificationsRealtime.emitToProfile(
            recipientProfileId,
            NOTIFICATIONS_SOCKET_EVENTS.CREATED,
            { items: notifications },
          );

          this.notificationsRealtime.emitToProfile(
            recipientProfileId,
            NOTIFICATIONS_SOCKET_EVENTS.UNREAD_COUNT_UPDATED,
            { unreadCount },
          );
        },
      ),
    );
  }

  async handleMessagingConversationRead(
    payload: MessagingConversationReadPayload,
  ) {
    const markedCount =
      await this.notificationsRepo.markMessageNotificationsAsReadForConversation(
        payload.readerProfileId,
        payload.conversationId,
      );

    if (markedCount <= 0) return;

    const unreadCount = await this.notificationsRepo.countUnreadForRecipient(
      payload.readerProfileId,
    );

    this.notificationsRealtime.emitToProfile(
      payload.readerProfileId,
      NOTIFICATIONS_SOCKET_EVENTS.READ,
      {
        notificationIds: [],
        all: false,
        conversationId: payload.conversationId,
      },
    );

    this.notificationsRealtime.emitToProfile(
      payload.readerProfileId,
      NOTIFICATIONS_SOCKET_EVENTS.UNREAD_COUNT_UPDATED,
      { unreadCount },
    );
  }

  private toPresenter(row: {
    id: string;
    type: NotificationPresenter['type'];
    title: string | null;
    body: string | null;
    payload: Record<string, unknown> | null;
    contextConversationId: string | null;
    contextMessageId: string | null;
    readAt: Date | null;
    createdAt: Date;
    actorProfileId: string | null;
    actorUsername: string | null;
    actorSlug: string | null;
    actorProfilePicture: string | null;
  }): NotificationPresenter {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      payload: row.payload,
      contextConversationId: row.contextConversationId,
      contextMessageId: row.contextMessageId,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      actor:
        row.actorProfileId && row.actorUsername && row.actorSlug
          ? {
              id: row.actorProfileId,
              username: row.actorUsername,
              slug: row.actorSlug,
              profilePicture: row.actorProfilePicture,
            }
          : null,
    };
  }

  private resolveFilter(value?: string): NotificationFilter {
    const normalized = String(value ?? 'ALL')
      .trim()
      .toUpperCase();
    if (NOTIFICATION_FILTERS.includes(normalized as NotificationFilter)) {
      return normalized as NotificationFilter;
    }

    throw new NotificationInvalidFilterError(value);
  }

  private resolveLimit(
    value: unknown,
    fallback: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private resolveOffset(value: unknown) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(Math.trunc(parsed), 0);
  }
}
