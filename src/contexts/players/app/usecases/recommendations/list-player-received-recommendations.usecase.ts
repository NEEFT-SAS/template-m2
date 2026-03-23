import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RecommendationPresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';

export type ListPlayerRecommendationsResult = {
  data: {
    items: RecommendationPresenter[];
    ratingAverage: number | null;
    ratingCount: number;
    ratingSum: number;
    hasAlreadyRecommended: boolean;
  };
  meta: {
    page: number;
    perPage: number;
    total: number;
  };
};

@Injectable()
export class ListPlayerReceivedRecommendationsUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
  ) {}

  async execute(
    targetSlug: string,
    query: { page: number; perPage: number },
    viewer: { pid?: string; slug?: string; roles?: string[] } | undefined,
    targetType: 'player' | 'team' = 'player',
  ): Promise<ListPlayerRecommendationsResult> {
    let targetProfileId: string | null = null;
    let targetTeamId: string | null = null;

    if (targetType === 'team') {
      const normalizedSlug = String(targetSlug ?? '').trim().toLowerCase();
      const team = normalizedSlug ? await this.teamRepo.findTeamBySlug(normalizedSlug) : null;
      if (!team) {
        throw new TeamNotFoundError(targetSlug);
      }
      targetTeamId = team.id;
    } else {
      targetProfileId = await this.repo.findProfileIdBySlug(targetSlug);
      if (!targetProfileId) {
        throw new PlayerNotFoundError(targetSlug);
      }
    }

    const { items, total, ratingAverage, ratingCount, ratingSum } = targetTeamId
      ? await this.repo.findTeamRecommendationsReceived(targetTeamId, {
          page: query.page,
          perPage: query.perPage,
        })
      : await this.repo.findPlayerRecommendationsReceived(targetProfileId!, {
          page: query.page,
          perPage: query.perPage,
        });

    const requesterProfileId = viewer?.pid ?? '';
    const hasAlreadyRecommended =
      !!requesterProfileId &&
      ((targetTeamId && (await this.repo.existsPlayerToTeamRecommendation(requesterProfileId, targetTeamId)))
        || (targetProfileId &&
          requesterProfileId !== targetProfileId &&
          (await this.repo.existsPlayerToPlayerRecommendation(requesterProfileId, targetProfileId))));

    return {
      data: {
        items: plainToInstance(RecommendationPresenter, items, { excludeExtraneousValues: true }),
        ratingAverage,
        ratingCount,
        ratingSum,
        hasAlreadyRecommended,
      },
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
      },
    };
  }
}
