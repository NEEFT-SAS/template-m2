import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import {
  NotificationListItemRecord,
  NotificationProfileSnapshot,
  NotificationRecord,
  NotificationsListResult,
  NotificationsRepositoryPort,
} from '../../app/ports/notifications.repository.port';
import { NotificationType } from '../../domain/types/notification.types';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationsRepositoryTypeorm implements NotificationsRepositoryPort {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profileRepo: Repository<UserProfileEntity>,
  ) {}

  async listForRecipient(
    recipientProfileId: string,
    onlyUnread: boolean,
    limit: number,
    offset: number,
  ): Promise<NotificationsListResult> {
    const unreadClause = onlyUnread ? ' AND n.read_at IS NULL ' : '';

    const rows = await this.notificationRepo.query(
      `
      SELECT
        n.id AS id,
        n.recipient_profile_id AS recipientProfileId,
        n.actor_profile_id AS actorProfileId,
        n.type AS type,
        n.title AS title,
        n.body AS body,
        n.payload AS payload,
        n.context_conversation_id AS contextConversationId,
        n.context_message_id AS contextMessageId,
        n.read_at AS readAt,
        n.created_at AS createdAt,
        a.username AS actorUsername,
        a.slug AS actorSlug,
        a.profile_picture AS actorProfilePicture
      FROM notifications n
      LEFT JOIN user_profiles a ON a.id = n.actor_profile_id
      WHERE n.recipient_profile_id = ?
      ${unreadClause}
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT ? OFFSET ?
      `,
      [recipientProfileId, limit, offset],
    );

    const countRows = await this.notificationRepo.query(
      `
      SELECT COUNT(*) AS total
      FROM notifications n
      WHERE n.recipient_profile_id = ?
      ${unreadClause}
      `,
      [recipientProfileId],
    );

    return {
      items: rows.map((row: any) => this.mapListItemRow(row)),
      total: Number(countRows?.[0]?.total ?? 0),
    };
  }

  async countUnreadForRecipient(recipientProfileId: string): Promise<number> {
    const rows = await this.notificationRepo.query(
      `
      SELECT COUNT(*) AS total
      FROM notifications n
      WHERE n.recipient_profile_id = ?
        AND n.read_at IS NULL
      `,
      [recipientProfileId],
    );

    return Number(rows?.[0]?.total ?? 0);
  }

  async findByIdForRecipient(
    notificationId: string,
    recipientProfileId: string,
  ): Promise<NotificationListItemRecord | null> {
    const rows = await this.notificationRepo.query(
      `
      SELECT
        n.id AS id,
        n.recipient_profile_id AS recipientProfileId,
        n.actor_profile_id AS actorProfileId,
        n.type AS type,
        n.title AS title,
        n.body AS body,
        n.payload AS payload,
        n.context_conversation_id AS contextConversationId,
        n.context_message_id AS contextMessageId,
        n.read_at AS readAt,
        n.created_at AS createdAt,
        a.username AS actorUsername,
        a.slug AS actorSlug,
        a.profile_picture AS actorProfilePicture
      FROM notifications n
      LEFT JOIN user_profiles a ON a.id = n.actor_profile_id
      WHERE n.id = ?
        AND n.recipient_profile_id = ?
      LIMIT 1
      `,
      [notificationId, recipientProfileId],
    );

    if (!rows?.[0]) return null;
    return this.mapListItemRow(rows[0]);
  }

  async createMany(
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
  ): Promise<NotificationRecord[]> {
    if (!notifications.length) return [];

    const entities = notifications.map((item) =>
      this.notificationRepo.create({
        recipientProfile: { id: item.recipientProfileId } as UserProfileEntity,
        actorProfile: item.actorProfileId
          ? ({ id: item.actorProfileId } as UserProfileEntity)
          : null,
        type: item.type,
        title: item.title,
        body: item.body,
        payload: item.payload,
        contextConversationId: item.contextConversationId,
        contextMessageId: item.contextMessageId,
      }),
    );

    const saved = await this.notificationRepo.save(entities);
    return saved.map((entity, index) => ({
      ...this.mapEntity(entity),
      recipientProfileId: notifications[index]?.recipientProfileId ?? '',
      actorProfileId: notifications[index]?.actorProfileId ?? null,
    }));
  }

  async markAsRead(
    notificationId: string,
    recipientProfileId: string,
  ): Promise<boolean> {
    const result = await this.notificationRepo.query(
      `
      UPDATE notifications
      SET read_at = NOW(6)
      WHERE id = ?
        AND recipient_profile_id = ?
        AND read_at IS NULL
      `,
      [notificationId, recipientProfileId],
    );

    return Number(result?.affectedRows ?? 0) > 0;
  }

  async markAllAsRead(recipientProfileId: string): Promise<number> {
    const result = await this.notificationRepo.query(
      `
      UPDATE notifications
      SET read_at = NOW(6)
      WHERE recipient_profile_id = ?
        AND read_at IS NULL
      `,
      [recipientProfileId],
    );

    return Number(result?.affectedRows ?? 0);
  }

  async markMessageNotificationsAsReadForConversation(
    recipientProfileId: string,
    conversationId: string,
  ): Promise<number> {
    const result = await this.notificationRepo.query(
      `
      UPDATE notifications
      SET read_at = NOW(6)
      WHERE recipient_profile_id = ?
        AND type = 'MESSAGING_MESSAGE_RECEIVED'
        AND context_conversation_id = ?
        AND read_at IS NULL
      `,
      [recipientProfileId, conversationId],
    );

    return Number(result?.affectedRows ?? 0);
  }

  async findProfileSnapshotById(
    profileId: string,
  ): Promise<NotificationProfileSnapshot | null> {
    const rows = await this.profileRepo.query(
      `
      SELECT
        p.id AS id,
        p.username AS username,
        p.slug AS slug,
        p.profile_picture AS profilePicture
      FROM user_profiles p
      WHERE p.id = ?
      LIMIT 1
      `,
      [profileId],
    );

    if (!rows?.[0]) return null;
    return {
      id: String(rows[0].id),
      username: String(rows[0].username),
      slug: String(rows[0].slug),
      profilePicture: rows[0].profilePicture
        ? String(rows[0].profilePicture)
        : null,
    };
  }

  private mapEntity(entity: NotificationEntity): NotificationRecord {
    return {
      id: entity.id,
      recipientProfileId: entity.recipientProfile?.id ?? '',
      actorProfileId: entity.actorProfile?.id ?? null,
      type: entity.type,
      title: entity.title ?? null,
      body: entity.body ?? null,
      payload: (entity.payload ?? null) as Record<string, unknown> | null,
      contextConversationId: entity.contextConversationId ?? null,
      contextMessageId: entity.contextMessageId ?? null,
      readAt: entity.readAt ?? null,
      createdAt: entity.createdAt,
    };
  }

  private mapListItemRow(row: any): NotificationListItemRecord {
    return {
      id: String(row.id),
      recipientProfileId: String(row.recipientProfileId),
      actorProfileId: row.actorProfileId ? String(row.actorProfileId) : null,
      type: String(row.type) as NotificationType,
      title: row.title ? String(row.title) : null,
      body: row.body ? String(row.body) : null,
      payload: this.readPayload(row.payload),
      contextConversationId: row.contextConversationId
        ? String(row.contextConversationId)
        : null,
      contextMessageId: row.contextMessageId
        ? String(row.contextMessageId)
        : null,
      readAt: row.readAt ? this.toDate(row.readAt) : null,
      createdAt: this.toDate(row.createdAt),
      actorUsername: row.actorUsername ? String(row.actorUsername) : null,
      actorSlug: row.actorSlug ? String(row.actorSlug) : null,
      actorProfilePicture: row.actorProfilePicture
        ? String(row.actorProfilePicture)
        : null,
    };
  }

  private readPayload(value: unknown): Record<string, unknown> | null {
    if (!value) return null;
    if (typeof value === 'object') return value as Record<string, unknown>;

    try {
      const parsed = JSON.parse(String(value));
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }

    return null;
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) return value;
    return new Date(String(value));
  }
}
