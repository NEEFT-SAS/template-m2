import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import {
  MESSAGING_ACCESS_REPOSITORY,
  MessagingAccessRepositoryPort,
  MessagingPlayerSnapshot,
  MessagingTeamSnapshot,
} from '../ports/messaging-access.repository.port';
import {
  MESSAGING_REPOSITORY,
  MessagingConversationListItem,
  MessagingConversationRecord,
  MessagingRepositoryPort,
} from '../ports/messaging.repository.port';
import {
  MessagingConversationSummary,
  MessagingEntityType,
  MessagingMessagePresenter,
  MESSAGING_SCOPES,
  MessagingScope,
  MESSAGING_SOCKET_EVENTS,
  MessagingTeamContext,
} from '../../domain/types/messaging.types';
import {
  MessagingConversationNotFoundError,
  MessagingEmptyMessageError,
  MessagingForbiddenError,
  MessagingInvalidEntityTypeError,
  MessagingInvalidScopeError,
  MessagingSelfConversationNotAllowedError,
  MessagingTargetNotFoundError,
  MessagingTargetRequiredError,
  MessagingTeamContextRequiredError,
} from '../../domain/errors/messaging.errors';
import { MessagingRealtimeService } from '../../infra/realtime/messaging-realtime.service';
import { MessagingMessageSentEvent } from '../../domain/events/message-sent.event';
import { MessagingConversationReadEvent } from '../../domain/events/conversation-read.event';

type MessagingConversationParticipant = {
  type: MessagingEntityType;
  id: string;
};

@Injectable()
export class MessagingService {
  constructor(
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBusPort,
    @Inject(MESSAGING_REPOSITORY)
    private readonly messagingRepo: MessagingRepositoryPort,
    @Inject(MESSAGING_ACCESS_REPOSITORY)
    private readonly messagingAccessRepo: MessagingAccessRepositoryPort,
    private readonly messagingRealtime: MessagingRealtimeService,
  ) {}

  async getConversations(
    requesterProfileId: string,
    query: {
      scope?: string;
      teamId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const scope = this.resolveScope(query.scope);
    const limit = this.resolveLimit(query.limit, 20, 1, 100);
    const offset = this.resolveOffset(query.offset);

    const requesterPlayer =
      await this.messagingAccessRepo.findPlayerById(requesterProfileId);
    if (!requesterPlayer) {
      throw new MessagingForbiddenError();
    }

    if (scope === 'SELF') {
      const rows = await this.messagingRepo.listConversationsForPlayer(
        requesterProfileId,
        requesterProfileId,
        limit,
        offset,
      );

      const items = await this.mapConversationsForSelfScope(
        rows.items,
        requesterProfileId,
        requesterPlayer,
      );
      return { items, total: rows.total, limit, offset };
    }

    const accessibleTeams =
      await this.messagingAccessRepo.listAccessibleTeams(requesterProfileId);
    const accessibleTeamMap = new Map(
      accessibleTeams.map((team) => [team.id, team]),
    );

    let teamIds = accessibleTeams.map((team) => team.id);
    if (query.teamId) {
      const team = accessibleTeamMap.get(query.teamId);
      if (!team) {
        throw new MessagingForbiddenError();
      }
      teamIds = [query.teamId];
    }

    const rows = await this.messagingRepo.listConversationsForTeams(
      teamIds,
      requesterProfileId,
      limit,
      offset,
    );

    const items = await this.mapConversationsForTeamScope(
      rows.items,
      requesterProfileId,
      accessibleTeamMap,
      query.teamId ?? null,
    );

    return { items, total: rows.total, limit, offset };
  }

  async getConversationMessages(
    requesterProfileId: string,
    conversationId: string,
    query: {
      limit?: number;
      beforeMessageId?: string;
    },
  ) {
    const conversation = await this.getConversationOrThrow(conversationId);
    await this.assertConversationAccess(conversation, requesterProfileId);

    const limit = this.resolveLimit(query.limit, 20, 1, 50);
    const page = await this.messagingRepo.listMessages(
      conversation.id,
      limit,
      query.beforeMessageId,
    );
    const firstUnreadMessageId =
      await this.messagingRepo.getFirstUnreadMessageId(
        conversation.id,
        requesterProfileId,
      );

    const participantProfileIds =
      await this.listConversationParticipantProfileIds(conversation);

    const items = page.items.map((message) => {
      const recipientCount = this.computeRecipientCount(
        participantProfileIds,
        message.senderProfileId,
      );
      const isOwn = message.senderProfileId === requesterProfileId;
      const deliveryStatus = isOwn
        ? recipientCount > 0 && message.readByCount >= recipientCount
          ? 'READ'
          : 'UNREAD'
        : null;

      return {
        id: message.id,
        conversationId: message.conversationId,
        senderProfileId: message.senderProfileId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        isOwn,
        deliveryStatus,
        readByCount: message.readByCount,
        recipientCount,
      } satisfies MessagingMessagePresenter;
    });

    return {
      items,
      limit,
      hasMore: page.hasMore,
      nextBeforeMessageId: page.nextBeforeMessageId,
      firstUnreadMessageId,
    };
  }

  async startConversation(
    requesterProfileId: string,
    payload: {
      scope?: string;
      contextTeamId?: string;
      targetType: string;
      targetId?: string;
      targetSlug?: string;
      content: string;
    },
  ) {
    const requesterPlayer =
      await this.messagingAccessRepo.findPlayerById(requesterProfileId);
    if (!requesterPlayer) {
      throw new MessagingForbiddenError();
    }

    const source = await this.resolveSourceParticipant(
      requesterProfileId,
      payload.scope,
      payload.contextTeamId,
    );
    const targetType = this.resolveEntityType(payload.targetType, 'targetType');
    const target = await this.resolveTargetParticipant(
      targetType,
      payload.targetId,
      payload.targetSlug,
    );

    if (source.type === target.type && source.id === target.id) {
      throw new MessagingSelfConversationNotAllowedError();
    }

    const [participantA, participantB] = this.sortParticipantsForKey(
      source,
      target,
    );
    const conversation = await this.findOrCreateConversation(
      participantA,
      participantB,
    );
    const message = await this.sendMessage(
      requesterProfileId,
      conversation.id,
      {
        content: payload.content,
      },
    );

    return {
      conversationId: conversation.id,
      message,
    };
  }

  async sendMessage(
    requesterProfileId: string,
    conversationId: string,
    payload: {
      content: string;
    },
  ) {
    const conversation = await this.getConversationOrThrow(conversationId);
    await this.assertConversationAccess(conversation, requesterProfileId);

    const content = String(payload.content ?? '').trim();
    if (!content) {
      throw new MessagingEmptyMessageError();
    }

    const message = await this.messagingRepo.createMessage(
      conversation.id,
      requesterProfileId,
      content,
    );
    const preview = this.buildPreview(content);
    await this.messagingRepo.touchConversationLastMessage(
      conversation.id,
      preview,
      requesterProfileId,
      message.createdAt,
    );

    const participantProfileIds =
      await this.listConversationParticipantProfileIds(conversation);
    const recipientCount = this.computeRecipientCount(
      participantProfileIds,
      message.senderProfileId,
    );
    const recipientProfileIds = participantProfileIds.filter(
      (profileId) => profileId !== requesterProfileId,
    );

    this.messagingRealtime.emitToProfiles(
      participantProfileIds,
      MESSAGING_SOCKET_EVENTS.MESSAGE_CREATED,
      {
        conversationId: conversation.id,
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderProfileId: message.senderProfileId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        },
      },
    );

    this.messagingRealtime.emitToProfiles(
      participantProfileIds,
      MESSAGING_SOCKET_EVENTS.CONVERSATION_UPDATED,
      {
        conversationId: conversation.id,
        lastMessage: {
          preview,
          senderProfileId: requesterProfileId,
          createdAt: message.createdAt.toISOString(),
        },
      },
    );

    await this.eventBus.publish(
      MessagingMessageSentEvent.create({
        conversationId: conversation.id,
        messageId: message.id,
        senderProfileId: requesterProfileId,
        recipientProfileIds,
        preview,
        createdAt: message.createdAt.toISOString(),
      }),
    );

    await this.emitUnreadCountUpdates(participantProfileIds);

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderProfileId: message.senderProfileId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      isOwn: true,
      deliveryStatus: recipientCount > 0 ? 'UNREAD' : null,
      readByCount: 0,
      recipientCount,
    } satisfies MessagingMessagePresenter;
  }

  async markConversationRead(
    requesterProfileId: string,
    conversationId: string,
    payload: {
      upToMessageId?: string;
    },
  ) {
    const conversation = await this.getConversationOrThrow(conversationId);
    await this.assertConversationAccess(conversation, requesterProfileId);

    const result = await this.messagingRepo.markConversationAsRead(
      conversation.id,
      requesterProfileId,
      payload.upToMessageId,
    );

    const unreadCount = await this.messagingRepo.countUnreadForConversation(
      conversation.id,
      requesterProfileId,
    );

    const participantProfileIds =
      await this.listConversationParticipantProfileIds(conversation);

    this.messagingRealtime.emitToProfiles(
      participantProfileIds,
      MESSAGING_SOCKET_EVENTS.CONVERSATION_READ,
      {
        conversationId: conversation.id,
        readerProfileId: requesterProfileId,
        upToMessageId: result.upToMessageId,
      },
    );

    this.messagingRealtime.emitToProfiles(
      participantProfileIds,
      MESSAGING_SOCKET_EVENTS.CONVERSATION_UPDATED,
      {
        conversationId: conversation.id,
      },
    );

    await this.eventBus.publish(
      MessagingConversationReadEvent.create({
        conversationId: conversation.id,
        readerProfileId: requesterProfileId,
        upToMessageId: result.upToMessageId,
      }),
    );

    await this.emitUnreadCountUpdates(participantProfileIds);

    return {
      conversationId: conversation.id,
      upToMessageId: result.upToMessageId,
      markedCount: result.markedCount,
      unreadCount,
    };
  }

  async getUnreadCount(requesterProfileId: string) {
    const unreadCount =
      await this.computeUnreadCountForProfile(requesterProfileId);
    return { unreadCount };
  }

  async getTeamContexts(requesterProfileId: string) {
    const requesterPlayer =
      await this.messagingAccessRepo.findPlayerById(requesterProfileId);
    if (!requesterPlayer) {
      throw new MessagingForbiddenError();
    }

    const teams =
      await this.messagingAccessRepo.listAccessibleTeams(requesterProfileId);
    const items = teams.map(
      (team) =>
        ({
          id: team.id,
          slug: team.slug,
          displayName: team.name,
          avatarUrl: team.logoPicture ?? null,
        }) satisfies MessagingTeamContext,
    );

    return { items };
  }

  private async mapConversationsForSelfScope(
    rows: MessagingConversationListItem[],
    requesterProfileId: string,
    requesterPlayer: MessagingPlayerSnapshot,
  ): Promise<MessagingConversationSummary[]> {
    const snapshots = await this.loadActorSnapshots(rows);

    return rows
      .map((row) => {
        const participantA = this.participantFromRow(row, 'A');
        const participantB = this.participantFromRow(row, 'B');

        const contextSide =
          participantA.type === 'PLAYER' &&
          participantA.id === requesterProfileId
            ? 'A'
            : participantB.type === 'PLAYER' &&
                participantB.id === requesterProfileId
              ? 'B'
              : null;
        if (!contextSide) return null;

        const contextParticipant =
          contextSide === 'A' ? participantA : participantB;
        const counterpartParticipant =
          contextSide === 'A' ? participantB : participantA;

        const context = this.toActor(
          contextParticipant,
          snapshots.players,
          snapshots.teams,
        ) ?? {
          id: requesterPlayer.id,
          type: 'PLAYER',
          slug: requesterPlayer.slug,
          displayName: requesterPlayer.username,
          avatarUrl: requesterPlayer.profilePicture ?? null,
        };

        const counterpart = this.toActor(
          counterpartParticipant,
          snapshots.players,
          snapshots.teams,
        );
        if (!counterpart) return null;

        return {
          id: row.id,
          scope: 'SELF',
          context,
          counterpart,
          unreadCount: row.unreadCount,
          lastMessage:
            row.lastMessageAt || row.lastMessagePreview
              ? {
                  preview: row.lastMessagePreview ?? '',
                  senderProfileId: row.lastMessageSenderProfileId ?? null,
                  createdAt: row.lastMessageAt
                    ? row.lastMessageAt.toISOString()
                    : null,
                }
              : null,
        } satisfies MessagingConversationSummary;
      })
      .filter((item) => item !== null) as MessagingConversationSummary[];
  }

  private async mapConversationsForTeamScope(
    rows: MessagingConversationListItem[],
    requesterProfileId: string,
    accessibleTeamMap: Map<string, MessagingTeamSnapshot>,
    preferredTeamId: string | null,
  ): Promise<MessagingConversationSummary[]> {
    const snapshots = await this.loadActorSnapshots(rows);
    const accessibleTeamIds = new Set(accessibleTeamMap.keys());

    return rows
      .map((row) => {
        const participantA = this.participantFromRow(row, 'A');
        const participantB = this.participantFromRow(row, 'B');

        const contextSide = this.pickTeamContextSide(
          participantA,
          participantB,
          accessibleTeamIds,
          preferredTeamId,
        );
        if (!contextSide) return null;

        const contextParticipant =
          contextSide === 'A' ? participantA : participantB;
        const counterpartParticipant =
          contextSide === 'A' ? participantB : participantA;
        const context = this.toActor(
          contextParticipant,
          snapshots.players,
          snapshots.teams,
        );
        const counterpart = this.toActor(
          counterpartParticipant,
          snapshots.players,
          snapshots.teams,
        );

        if (!context || !counterpart) return null;

        return {
          id: row.id,
          scope: 'TEAM',
          context,
          counterpart,
          unreadCount: row.unreadCount,
          lastMessage:
            row.lastMessageAt || row.lastMessagePreview
              ? {
                  preview: row.lastMessagePreview ?? '',
                  senderProfileId: row.lastMessageSenderProfileId ?? null,
                  createdAt: row.lastMessageAt
                    ? row.lastMessageAt.toISOString()
                    : null,
                }
              : null,
        } satisfies MessagingConversationSummary;
      })
      .filter((item) => item !== null) as MessagingConversationSummary[];
  }

  private pickTeamContextSide(
    participantA: MessagingConversationParticipant,
    participantB: MessagingConversationParticipant,
    accessibleTeamIds: Set<string>,
    preferredTeamId: string | null,
  ): 'A' | 'B' | null {
    if (preferredTeamId) {
      if (participantA.type === 'TEAM' && participantA.id === preferredTeamId)
        return 'A';
      if (participantB.type === 'TEAM' && participantB.id === preferredTeamId)
        return 'B';
      return null;
    }

    const aAccessible =
      participantA.type === 'TEAM' && accessibleTeamIds.has(participantA.id);
    const bAccessible =
      participantB.type === 'TEAM' && accessibleTeamIds.has(participantB.id);

    if (aAccessible) return 'A';
    if (bAccessible) return 'B';
    return null;
  }

  private participantFromRow(
    row: MessagingConversationListItem | MessagingConversationRecord,
    side: 'A' | 'B',
  ): MessagingConversationParticipant {
    const type = side === 'A' ? row.participantAType : row.participantBType;
    const playerId =
      side === 'A' ? row.participantAPlayerId : row.participantBPlayerId;
    const teamId =
      side === 'A' ? row.participantATeamId : row.participantBTeamId;

    return {
      type,
      id: type === 'PLAYER' ? String(playerId) : String(teamId),
    };
  }

  private async loadActorSnapshots(rows: MessagingConversationListItem[]) {
    const playerIds = new Set<string>();
    const teamIds = new Set<string>();

    rows.forEach((row) => {
      if (row.participantAPlayerId) playerIds.add(row.participantAPlayerId);
      if (row.participantBPlayerId) playerIds.add(row.participantBPlayerId);
      if (row.participantATeamId) teamIds.add(row.participantATeamId);
      if (row.participantBTeamId) teamIds.add(row.participantBTeamId);
    });

    const [players, teams] = await Promise.all([
      this.messagingAccessRepo.findPlayersByIds(Array.from(playerIds)),
      this.messagingAccessRepo.findTeamsByIds(Array.from(teamIds)),
    ]);

    return {
      players: new Map(players.map((player) => [player.id, player])),
      teams: new Map(teams.map((team) => [team.id, team])),
    };
  }

  private toActor(
    participant: MessagingConversationParticipant,
    players: Map<string, MessagingPlayerSnapshot>,
    teams: Map<string, MessagingTeamSnapshot>,
  ) {
    if (participant.type === 'PLAYER') {
      const player = players.get(participant.id);
      if (!player) return null;

      return {
        id: player.id,
        type: 'PLAYER',
        slug: player.slug,
        displayName: player.username,
        avatarUrl: player.profilePicture ?? null,
      } as const;
    }

    const team = teams.get(participant.id);
    if (!team) return null;

    return {
      id: team.id,
      type: 'TEAM',
      slug: team.slug,
      displayName: team.name,
      avatarUrl: team.logoPicture ?? null,
    } as const;
  }

  private async getConversationOrThrow(conversationId: string) {
    const conversation =
      await this.messagingRepo.findConversationById(conversationId);
    if (!conversation) {
      throw new MessagingConversationNotFoundError(conversationId);
    }
    return conversation;
  }

  private async assertConversationAccess(
    conversation: MessagingConversationRecord,
    requesterProfileId: string,
  ) {
    const hasDirectAccess =
      (conversation.participantAType === 'PLAYER' &&
        conversation.participantAPlayerId === requesterProfileId) ||
      (conversation.participantBType === 'PLAYER' &&
        conversation.participantBPlayerId === requesterProfileId);

    if (hasDirectAccess) return;

    const teamIds: string[] = [];
    if (
      conversation.participantAType === 'TEAM' &&
      conversation.participantATeamId
    ) {
      teamIds.push(conversation.participantATeamId);
    }
    if (
      conversation.participantBType === 'TEAM' &&
      conversation.participantBTeamId
    ) {
      teamIds.push(conversation.participantBTeamId);
    }

    if (!teamIds.length) {
      throw new MessagingForbiddenError(conversation.id);
    }

    for (const teamId of teamIds) {
      const allowed = await this.messagingAccessRepo.canAccessTeam(
        teamId,
        requesterProfileId,
      );
      if (allowed) return;
    }

    throw new MessagingForbiddenError(conversation.id);
  }

  private async listConversationParticipantProfileIds(
    conversation: MessagingConversationRecord,
  ) {
    const participants = [
      this.participantFromRow(conversation, 'A'),
      this.participantFromRow(conversation, 'B'),
    ];

    const profileIds = new Set<string>();
    for (const participant of participants) {
      const ids = await this.messagingAccessRepo.listEntityProfileIds(
        participant.type,
        participant.id,
      );
      ids.forEach((id) => profileIds.add(id));
    }

    return Array.from(profileIds);
  }

  private async resolveSourceParticipant(
    requesterProfileId: string,
    scope?: string,
    contextTeamId?: string,
  ): Promise<MessagingConversationParticipant> {
    const resolvedScope = this.resolveScope(scope);
    if (resolvedScope === 'SELF') {
      return {
        type: 'PLAYER',
        id: requesterProfileId,
      };
    }

    const teamId = String(contextTeamId ?? '').trim();
    if (!teamId) {
      throw new MessagingTeamContextRequiredError();
    }

    const canAccessTeam = await this.messagingAccessRepo.canAccessTeam(
      teamId,
      requesterProfileId,
    );
    if (!canAccessTeam) {
      throw new MessagingForbiddenError();
    }

    return {
      type: 'TEAM',
      id: teamId,
    };
  }

  private async resolveTargetParticipant(
    targetType: MessagingEntityType,
    targetId?: string,
    targetSlug?: string,
  ): Promise<MessagingConversationParticipant> {
    const id = String(targetId ?? '').trim();
    const slug = String(targetSlug ?? '').trim();

    if (!id && !slug) {
      throw new MessagingTargetRequiredError();
    }

    if (targetType === 'PLAYER') {
      const targetPlayer = id
        ? await this.messagingAccessRepo.findPlayerById(id)
        : await this.messagingAccessRepo.findPlayerBySlug(slug);
      if (!targetPlayer) {
        throw new MessagingTargetNotFoundError('PLAYER', id || slug);
      }

      return {
        type: 'PLAYER',
        id: targetPlayer.id,
      };
    }

    const targetTeam = id
      ? await this.messagingAccessRepo.findTeamById(id)
      : await this.messagingAccessRepo.findTeamBySlug(slug);
    if (!targetTeam) {
      throw new MessagingTargetNotFoundError('TEAM', id || slug);
    }

    return {
      type: 'TEAM',
      id: targetTeam.id,
    };
  }

  private resolveEntityType(
    value: string | null | undefined,
    field: 'targetType' | 'sourceType',
  ): MessagingEntityType {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    if (normalized === 'PLAYER' || normalized === 'TEAM') {
      return normalized;
    }

    throw new MessagingInvalidEntityTypeError(field, value ?? null);
  }

  private sortParticipantsForKey(
    left: MessagingConversationParticipant,
    right: MessagingConversationParticipant,
  ): [MessagingConversationParticipant, MessagingConversationParticipant] {
    const leftKey = this.participantKey(left);
    const rightKey = this.participantKey(right);

    if (leftKey <= rightKey) {
      return [left, right];
    }

    return [right, left];
  }

  private participantKey(participant: MessagingConversationParticipant) {
    return `${participant.type}:${participant.id}`;
  }

  private buildConversationKey(
    participantA: MessagingConversationParticipant,
    participantB: MessagingConversationParticipant,
  ) {
    return `${this.participantKey(participantA)}|${this.participantKey(participantB)}`;
  }

  private async findOrCreateConversation(
    participantA: MessagingConversationParticipant,
    participantB: MessagingConversationParticipant,
  ) {
    const conversationKey = this.buildConversationKey(
      participantA,
      participantB,
    );
    const existing =
      await this.messagingRepo.findConversationByKey(conversationKey);
    if (existing) {
      return existing;
    }

    try {
      return await this.messagingRepo.createConversation({
        conversationKey,
        participantAType: participantA.type,
        participantAPlayerId:
          participantA.type === 'PLAYER' ? participantA.id : null,
        participantATeamId:
          participantA.type === 'TEAM' ? participantA.id : null,
        participantBType: participantB.type,
        participantBPlayerId:
          participantB.type === 'PLAYER' ? participantB.id : null,
        participantBTeamId:
          participantB.type === 'TEAM' ? participantB.id : null,
      });
    } catch (error) {
      const duplicate =
        await this.messagingRepo.findConversationByKey(conversationKey);
      if (duplicate) {
        return duplicate;
      }

      throw error;
    }
  }

  private computeRecipientCount(
    participantProfileIds: string[],
    senderProfileId: string,
  ) {
    if (!participantProfileIds.length) return 0;
    const senderIncluded = participantProfileIds.includes(senderProfileId);
    return senderIncluded
      ? Math.max(participantProfileIds.length - 1, 0)
      : participantProfileIds.length;
  }

  private buildPreview(content: string) {
    const compact = content.replace(/\s+/g, ' ').trim();
    if (compact.length <= 160) return compact;
    return `${compact.slice(0, 157)}...`;
  }

  private resolveScope(scope?: string): MessagingScope {
    const normalized = String(scope ?? 'SELF')
      .trim()
      .toUpperCase();
    if (MESSAGING_SCOPES.includes(normalized as MessagingScope)) {
      return normalized as MessagingScope;
    }

    throw new MessagingInvalidScopeError(scope ?? null);
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

  private async computeUnreadCountForProfile(profileId: string) {
    const accessibleTeams =
      await this.messagingAccessRepo.listAccessibleTeams(profileId);
    const teamIds = accessibleTeams.map((team) => team.id);
    return this.messagingRepo.countUnreadForViewer(profileId, teamIds);
  }

  private async emitUnreadCountUpdates(profileIds: string[]) {
    const uniqueProfileIds = Array.from(new Set(profileIds.filter(Boolean)));
    if (!uniqueProfileIds.length) return;

    await Promise.all(
      uniqueProfileIds.map(async (profileId) => {
        const unreadCount = await this.computeUnreadCountForProfile(profileId);
        this.messagingRealtime.emitToProfile(
          profileId,
          MESSAGING_SOCKET_EVENTS.UNREAD_COUNT_UPDATED,
          { unreadCount },
        );
      }),
    );
  }
}
