import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecommendationDto, RecommendationPresenter, RecommendationTargetType, toLowerCaseTrim } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';
import { RecommendationAlreadyExistsError, RecommendationGameNotFoundError, RecommendationSelfNotAllowedError } from '../../../domain/errors/recommendation.errors';
import { PlayerRecommendationReceivedEvent } from '../../../domain/events/player-recommendation-received.event';

@Injectable()
export class CreateRecommendationUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
    @InjectRepository(RscGameEntity) private readonly gamesRepo: Repository<RscGameEntity>,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    authorProfileId: string,
    authorSlug: string,
    targetType: RecommendationTargetType,
    targetSlug: string,
    dto: CreateRecommendationDto,
  ): Promise<RecommendationPresenter> {
    if (!authorProfileId) {
      throw new PlayerNotFoundError(authorSlug);
    }

    const authorProfile = await this.repo.findPublicProfileBySlug(authorSlug);
    if (!authorProfile) {
      throw new PlayerNotFoundError(authorSlug);
    }

    let targetProfileId: string | null = null;
    let targetTeamId: string | null = null;
    let targetPlayerEmail: string | null = null;
    let targetPlayerUsername: string | null = null;
    let targetPlayerSlug: string | null = null;

    if (targetType === 'player') {
      const targetSnapshot = await this.repo.findPrivateProfileBySlug(targetSlug);
      if (!targetSnapshot) {
        throw new PlayerNotFoundError(targetSlug);
      }

      if (targetSnapshot.profile.id === authorProfileId) {
        throw new RecommendationSelfNotAllowedError();
      }

      const alreadyExists = await this.repo.existsPlayerToPlayerRecommendation(authorProfileId, targetSnapshot.profile.id);
      if (alreadyExists) {
        throw new RecommendationAlreadyExistsError();
      }

      targetProfileId = targetSnapshot.profile.id;
      targetPlayerEmail = targetSnapshot.credentials.email;
      targetPlayerUsername = targetSnapshot.profile.username;
      targetPlayerSlug = targetSnapshot.profile.slug;
    } else {
      const normalized = toLowerCaseTrim(targetSlug);
      const targetTeam = normalized ? await this.teamRepo.findTeamBySlug(normalized) : null;
      if (!targetTeam) {
        throw new TeamNotFoundError(targetSlug);
      }

      targetTeamId = targetTeam.id;
    }

    let gameSlug: string | null = null;
    let gameName: string | null = null;
    let gameIconUrl: string | null = null;

    if (dto.gameId) {
      const game = await this.gamesRepo.findOne({ where: { id: dto.gameId } });
      if (!game) {
        throw new RecommendationGameNotFoundError(dto.gameId);
      }
      gameSlug = game.slug;
      gameName = game.name;
      gameIconUrl = game.icon ?? null;
    }

    const authorDisplayName = authorProfile.username;
    const authorPublicSlug = authorProfile.slug;
    const authorAvatarUrl = authorProfile.profilePicture ?? null;

    const recommendation = await this.repo.createRecommendation({
      targetType,
      targetProfileId,
      targetTeamId,
      authorType: 'player',
      authorProfileId,
      authorTeamId: null,
      authorDisplayName,
      authorSlug: authorPublicSlug,
      authorAvatarUrl,
      gameSlug,
      gameName,
      gameIconUrl,
      role: dto.role ?? null,
      relationship: dto.relationship ?? null,
      tags: dto.tags,
      content: dto.content,
      rating: dto.rating ?? null,
    });

    if (targetType === 'player' && targetPlayerEmail && targetProfileId && targetPlayerUsername && targetPlayerSlug) {
      await this.eventBus.publish(
        PlayerRecommendationReceivedEvent.create({
          recommendationId: recommendation.id,
          recipientProfileId: targetProfileId,
          recipientEmail: targetPlayerEmail,
          recipientSlug: targetPlayerSlug,
          recipientUsername: targetPlayerUsername,
          authorDisplayName,
          authorSlug: authorPublicSlug,
          content: recommendation.content,
          createdAt: recommendation.createdAt,
        }),
      );
    }

    return plainToInstance(RecommendationPresenter, recommendation, { excludeExtraneousValues: true });
  }
}
