import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MessagingConversationListItem,
  MessagingConversationListResult,
  MessagingConversationRecord,
  MessagingMarkReadResult,
  MessagingMessagePageResult,
  MessagingMessageRecord,
  MessagingRepositoryPort,
} from '../../app/ports/messaging.repository.port';
import { MessagingConversationEntity } from '../entities/messaging-conversation.entity';
import { MessagingMessageEntity } from '../entities/messaging-message.entity';

@Injectable()
export class MessagingRepositoryTypeorm implements MessagingRepositoryPort {
  constructor(
    @InjectRepository(MessagingConversationEntity)
    private readonly conversationRepo: Repository<MessagingConversationEntity>,
    @InjectRepository(MessagingMessageEntity)
    private readonly messageRepo: Repository<MessagingMessageEntity>,
  ) {}

  async findConversationById(conversationId: string): Promise<MessagingConversationRecord | null> {
    const row = await this.conversationRepo.query(
      `
      SELECT
        c.id AS id,
        c.conversation_key AS conversationKey,
        c.participant_a_type AS participantAType,
        c.participant_a_player_id AS participantAPlayerId,
        c.participant_a_team_id AS participantATeamId,
        c.participant_b_type AS participantBType,
        c.participant_b_player_id AS participantBPlayerId,
        c.participant_b_team_id AS participantBTeamId,
        c.last_message_preview AS lastMessagePreview,
        c.last_message_sender_profile_id AS lastMessageSenderProfileId,
        c.last_message_at AS lastMessageAt,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
      FROM messaging_conversations c
      WHERE c.id = ?
      LIMIT 1
      `,
      [conversationId],
    );

    if (!row?.[0]) return null;
    return this.mapConversationRow(row[0]);
  }

  async findConversationByKey(conversationKey: string): Promise<MessagingConversationRecord | null> {
    const row = await this.conversationRepo.query(
      `
      SELECT
        c.id AS id,
        c.conversation_key AS conversationKey,
        c.participant_a_type AS participantAType,
        c.participant_a_player_id AS participantAPlayerId,
        c.participant_a_team_id AS participantATeamId,
        c.participant_b_type AS participantBType,
        c.participant_b_player_id AS participantBPlayerId,
        c.participant_b_team_id AS participantBTeamId,
        c.last_message_preview AS lastMessagePreview,
        c.last_message_sender_profile_id AS lastMessageSenderProfileId,
        c.last_message_at AS lastMessageAt,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt
      FROM messaging_conversations c
      WHERE c.conversation_key = ?
      LIMIT 1
      `,
      [conversationKey],
    );

    if (!row?.[0]) return null;
    return this.mapConversationRow(row[0]);
  }

  async createConversation(params: {
    conversationKey: string;
    participantAType: 'PLAYER' | 'TEAM';
    participantAPlayerId: string | null;
    participantATeamId: string | null;
    participantBType: 'PLAYER' | 'TEAM';
    participantBPlayerId: string | null;
    participantBTeamId: string | null;
  }): Promise<MessagingConversationRecord> {
    const entity = this.conversationRepo.create({
      conversationKey: params.conversationKey,
      participantAType: params.participantAType,
      participantAPlayer: params.participantAPlayerId ? { id: params.participantAPlayerId } : null,
      participantATeam: params.participantATeamId ? { id: params.participantATeamId } : null,
      participantBType: params.participantBType,
      participantBPlayer: params.participantBPlayerId ? { id: params.participantBPlayerId } : null,
      participantBTeam: params.participantBTeamId ? { id: params.participantBTeamId } : null,
    });

    await this.conversationRepo.save(entity);

    const created = await this.findConversationById(entity.id);
    if (!created) {
      throw new Error('Conversation creation failed');
    }

    return created;
  }

  async touchConversationLastMessage(
    conversationId: string,
    preview: string,
    senderProfileId: string,
    createdAt: Date,
  ): Promise<void> {
    await this.conversationRepo.update(
      { id: conversationId },
      {
        lastMessagePreview: preview,
        lastMessageSenderProfileId: senderProfileId,
        lastMessageAt: createdAt,
      },
    );
  }

  async listConversationsForPlayer(
    profileId: string,
    viewerProfileId: string,
    limit: number,
    offset: number,
  ): Promise<MessagingConversationListResult> {
    const rows = await this.conversationRepo.query(
      `
      SELECT
        c.id AS id,
        c.conversation_key AS conversationKey,
        c.participant_a_type AS participantAType,
        c.participant_a_player_id AS participantAPlayerId,
        c.participant_a_team_id AS participantATeamId,
        c.participant_b_type AS participantBType,
        c.participant_b_player_id AS participantBPlayerId,
        c.participant_b_team_id AS participantBTeamId,
        c.last_message_preview AS lastMessagePreview,
        c.last_message_sender_profile_id AS lastMessageSenderProfileId,
        c.last_message_at AS lastMessageAt,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        (
          SELECT COUNT(*)
          FROM messaging_messages m
          WHERE m.conversation_id = c.id
            AND m.sender_profile_id <> ?
            AND NOT EXISTS (
              SELECT 1
              FROM messaging_message_reads mr
              WHERE mr.message_id = m.id
                AND mr.reader_profile_id = ?
            )
        ) AS unreadCount
      FROM messaging_conversations c
      WHERE (
        (c.participant_a_type = 'PLAYER' AND c.participant_a_player_id = ?)
        OR (c.participant_b_type = 'PLAYER' AND c.participant_b_player_id = ?)
      )
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
      LIMIT ? OFFSET ?
      `,
      [viewerProfileId, viewerProfileId, profileId, profileId, limit, offset],
    );

    const countRows = await this.conversationRepo.query(
      `
      SELECT COUNT(*) AS total
      FROM messaging_conversations c
      WHERE (
        (c.participant_a_type = 'PLAYER' AND c.participant_a_player_id = ?)
        OR (c.participant_b_type = 'PLAYER' AND c.participant_b_player_id = ?)
      )
      `,
      [profileId, profileId],
    );

    return {
      items: rows.map((row: any) => this.mapConversationListRow(row)),
      total: Number(countRows?.[0]?.total ?? 0),
    };
  }

  async listConversationsForTeams(
    teamIds: string[],
    viewerProfileId: string,
    limit: number,
    offset: number,
  ): Promise<MessagingConversationListResult> {
    if (!teamIds.length) {
      return { items: [], total: 0 };
    }

    const teamPlaceholders = teamIds.map(() => '?').join(', ');

    const listSql = `
      SELECT
        c.id AS id,
        c.conversation_key AS conversationKey,
        c.participant_a_type AS participantAType,
        c.participant_a_player_id AS participantAPlayerId,
        c.participant_a_team_id AS participantATeamId,
        c.participant_b_type AS participantBType,
        c.participant_b_player_id AS participantBPlayerId,
        c.participant_b_team_id AS participantBTeamId,
        c.last_message_preview AS lastMessagePreview,
        c.last_message_sender_profile_id AS lastMessageSenderProfileId,
        c.last_message_at AS lastMessageAt,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        (
          SELECT COUNT(*)
          FROM messaging_messages m
          WHERE m.conversation_id = c.id
            AND m.sender_profile_id <> ?
            AND NOT EXISTS (
              SELECT 1
              FROM messaging_message_reads mr
              WHERE mr.message_id = m.id
                AND mr.reader_profile_id = ?
            )
        ) AS unreadCount
      FROM messaging_conversations c
      WHERE (
        (c.participant_a_type = 'TEAM' AND c.participant_a_team_id IN (${teamPlaceholders}))
        OR (c.participant_b_type = 'TEAM' AND c.participant_b_team_id IN (${teamPlaceholders}))
      )
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [
      viewerProfileId,
      viewerProfileId,
      ...teamIds,
      ...teamIds,
      limit,
      offset,
    ];

    const rows = await this.conversationRepo.query(listSql, listParams);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM messaging_conversations c
      WHERE (
        (c.participant_a_type = 'TEAM' AND c.participant_a_team_id IN (${teamPlaceholders}))
        OR (c.participant_b_type = 'TEAM' AND c.participant_b_team_id IN (${teamPlaceholders}))
      )
    `;

    const countRows = await this.conversationRepo.query(countSql, [...teamIds, ...teamIds]);

    return {
      items: rows.map((row: any) => this.mapConversationListRow(row)),
      total: Number(countRows?.[0]?.total ?? 0),
    };
  }

  async listMessages(
    conversationId: string,
    limit: number,
    beforeMessageId?: string | null,
  ): Promise<MessagingMessagePageResult> {
    let cursorCreatedAt: Date | null = null;
    let cursorMessageId: string | null = null;

    if (beforeMessageId) {
      const cursorRows = await this.conversationRepo.query(
        `
        SELECT m.id AS id, m.created_at AS createdAt
        FROM messaging_messages m
        WHERE m.id = ?
          AND m.conversation_id = ?
        LIMIT 1
        `,
        [beforeMessageId, conversationId],
      );

      if (!cursorRows?.[0]) {
        return { items: [], hasMore: false, nextBeforeMessageId: null };
      }

      cursorCreatedAt = this.toDate(cursorRows[0].createdAt);
      cursorMessageId = String(cursorRows[0].id);
    }

    const whereParts = ['m.conversation_id = ?'];
    const params: Array<string | number | Date> = [conversationId];

    if (cursorCreatedAt && cursorMessageId) {
      whereParts.push('(m.created_at < ? OR (m.created_at = ? AND m.id < ?))');
      params.push(cursorCreatedAt, cursorCreatedAt, cursorMessageId);
    }

    const pageLimit = Math.max(1, limit);
    params.push(pageLimit + 1);

    const sql = `
      SELECT
        m.id AS id,
        m.conversation_id AS conversationId,
        m.sender_profile_id AS senderProfileId,
        m.content AS content,
        m.created_at AS createdAt,
        (
          SELECT COUNT(*)
          FROM messaging_message_reads mr
          WHERE mr.message_id = m.id
            AND mr.reader_profile_id <> m.sender_profile_id
        ) AS readByCount
      FROM messaging_messages m
      WHERE ${whereParts.join(' AND ')}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ?
    `;

    const rows = await this.conversationRepo.query(sql, params);
    const hasMore = rows.length > pageLimit;
    const sliced = hasMore ? rows.slice(0, pageLimit) : rows;

    const mappedDesc = sliced.map((row: any) => this.mapMessageRow(row));
    const mappedAsc = mappedDesc.reverse();
    const nextBeforeMessageId = mappedAsc.length ? mappedAsc[0].id : null;

    return {
      items: mappedAsc,
      hasMore,
      nextBeforeMessageId,
    };
  }

  async createMessage(
    conversationId: string,
    senderProfileId: string,
    content: string,
  ): Promise<MessagingMessageRecord> {
    const entity = this.messageRepo.create({
      conversation: { id: conversationId },
      senderProfile: { id: senderProfileId },
      content,
    });

    await this.messageRepo.save(entity);

    return {
      id: entity.id,
      conversationId,
      senderProfileId,
      content: entity.content,
      createdAt: entity.createdAt,
      readByCount: 0,
    };
  }

  async markConversationAsRead(
    conversationId: string,
    readerProfileId: string,
    upToMessageId?: string | null,
  ): Promise<MessagingMarkReadResult> {
    const cursorRows = upToMessageId
      ? await this.conversationRepo.query(
        `
          SELECT m.id AS id, m.created_at AS createdAt
          FROM messaging_messages m
          WHERE m.id = ?
            AND m.conversation_id = ?
          LIMIT 1
        `,
        [upToMessageId, conversationId],
      )
      : await this.conversationRepo.query(
        `
          SELECT m.id AS id, m.created_at AS createdAt
          FROM messaging_messages m
          WHERE m.conversation_id = ?
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        `,
        [conversationId],
      );

    if (!cursorRows?.[0]) {
      return { upToMessageId: null, markedCount: 0 };
    }

    const cursorId = String(cursorRows[0].id);
    const cursorCreatedAt = this.toDate(cursorRows[0].createdAt);

    const insertResult = await this.conversationRepo.query(
      `
      INSERT IGNORE INTO messaging_message_reads (id, message_id, reader_profile_id, read_at)
      SELECT UUID(), m.id, ?, NOW(6)
      FROM messaging_messages m
      WHERE m.conversation_id = ?
        AND m.sender_profile_id <> ?
        AND (m.created_at < ? OR (m.created_at = ? AND m.id <= ?))
      `,
      [readerProfileId, conversationId, readerProfileId, cursorCreatedAt, cursorCreatedAt, cursorId],
    );

    return {
      upToMessageId: cursorId,
      markedCount: Number(insertResult?.affectedRows ?? 0),
    };
  }

  async countUnreadForConversation(conversationId: string, viewerProfileId: string): Promise<number> {
    const rows = await this.conversationRepo.query(
      `
      SELECT COUNT(*) AS total
      FROM messaging_messages m
      WHERE m.conversation_id = ?
        AND m.sender_profile_id <> ?
        AND NOT EXISTS (
          SELECT 1
          FROM messaging_message_reads mr
          WHERE mr.message_id = m.id
            AND mr.reader_profile_id = ?
        )
      `,
      [conversationId, viewerProfileId, viewerProfileId],
    );

    return Number(rows?.[0]?.total ?? 0);
  }

  async countUnreadForViewer(viewerProfileId: string, teamIds: string[]): Promise<number> {
    const teamPlaceholders = teamIds.length ? teamIds.map(() => '?').join(', ') : '';
    const teamClause = teamIds.length
      ? `
        OR (c.participant_a_type = 'TEAM' AND c.participant_a_team_id IN (${teamPlaceholders}))
        OR (c.participant_b_type = 'TEAM' AND c.participant_b_team_id IN (${teamPlaceholders}))
      `
      : '';

    const sql = `
      SELECT COUNT(*) AS total
      FROM messaging_messages m
      INNER JOIN messaging_conversations c ON c.id = m.conversation_id
      WHERE m.sender_profile_id <> ?
        AND NOT EXISTS (
          SELECT 1
          FROM messaging_message_reads mr
          WHERE mr.message_id = m.id
            AND mr.reader_profile_id = ?
        )
        AND (
          (c.participant_a_type = 'PLAYER' AND c.participant_a_player_id = ?)
          OR (c.participant_b_type = 'PLAYER' AND c.participant_b_player_id = ?)
          ${teamClause}
        )
    `;

    const params = [
      viewerProfileId,
      viewerProfileId,
      viewerProfileId,
      viewerProfileId,
      ...(teamIds.length ? [...teamIds, ...teamIds] : []),
    ];

    const rows = await this.conversationRepo.query(sql, params);
    return Number(rows?.[0]?.total ?? 0);
  }

  async getFirstUnreadMessageId(conversationId: string, viewerProfileId: string): Promise<string | null> {
    const rows = await this.conversationRepo.query(
      `
      SELECT m.id AS id
      FROM messaging_messages m
      WHERE m.conversation_id = ?
        AND m.sender_profile_id <> ?
        AND NOT EXISTS (
          SELECT 1
          FROM messaging_message_reads mr
          WHERE mr.message_id = m.id
            AND mr.reader_profile_id = ?
        )
      ORDER BY m.created_at ASC, m.id ASC
      LIMIT 1
      `,
      [conversationId, viewerProfileId, viewerProfileId],
    );

    return rows?.[0]?.id ? String(rows[0].id) : null;
  }

  private mapConversationListRow(row: any): MessagingConversationListItem {
    const record = this.mapConversationRow(row);
    return {
      ...record,
      unreadCount: Number(row.unreadCount ?? 0),
    };
  }

  private mapConversationRow(row: any): MessagingConversationRecord {
    return {
      id: String(row.id),
      conversationKey: String(row.conversationKey),
      participantAType: String(row.participantAType) as MessagingConversationRecord['participantAType'],
      participantAPlayerId: row.participantAPlayerId ? String(row.participantAPlayerId) : null,
      participantATeamId: row.participantATeamId ? String(row.participantATeamId) : null,
      participantBType: String(row.participantBType) as MessagingConversationRecord['participantBType'],
      participantBPlayerId: row.participantBPlayerId ? String(row.participantBPlayerId) : null,
      participantBTeamId: row.participantBTeamId ? String(row.participantBTeamId) : null,
      lastMessagePreview: row.lastMessagePreview ? String(row.lastMessagePreview) : null,
      lastMessageSenderProfileId: row.lastMessageSenderProfileId ? String(row.lastMessageSenderProfileId) : null,
      lastMessageAt: this.toDateOrNull(row.lastMessageAt),
      createdAt: this.toDate(row.createdAt),
      updatedAt: this.toDate(row.updatedAt),
    };
  }

  private mapMessageRow(row: any): MessagingMessageRecord {
    return {
      id: String(row.id),
      conversationId: String(row.conversationId),
      senderProfileId: String(row.senderProfileId),
      content: String(row.content ?? ''),
      createdAt: this.toDate(row.createdAt),
      readByCount: Number(row.readByCount ?? 0),
    };
  }

  private toDate(value: unknown): Date {
    if (value instanceof Date) return value;
    return new Date(String(value));
  }

  private toDateOrNull(value: unknown): Date | null {
    if (!value) return null;
    return this.toDate(value);
  }
}
