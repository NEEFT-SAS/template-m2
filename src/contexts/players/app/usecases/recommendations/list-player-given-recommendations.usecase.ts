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
  };
  meta: {
    page: number;
    perPage: number;
    total: number;
  };
};

@Injectable()
export class ListPlayerGivenRecommendationsUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
  ) {}

  async execute(
    authorSlug: string,
    query: { page: number; perPage: number },
    _viewer: { slug?: string; roles?: string[] } | undefined,
    authorType: 'player' | 'team' = 'player',
  ): Promise<ListPlayerRecommendationsResult> {
    let authorProfileId: string | null = null;
    let authorTeamId: string | null = null;

    if (authorType === 'team') {
      const normalizedSlug = String(authorSlug ?? '').trim().toLowerCase();
      const team = normalizedSlug ? await this.teamRepo.findTeamBySlug(normalizedSlug) : null;
      if (!team) {
        throw new TeamNotFoundError(authorSlug);
      }
      authorTeamId = team.id;
    } else {
      authorProfileId = await this.repo.findProfileIdBySlug(authorSlug);
      if (!authorProfileId) {
        throw new PlayerNotFoundError(authorSlug);
      }
    }

    const { items, total, ratingAverage, ratingCount, ratingSum } = authorTeamId
      ? await this.repo.findTeamRecommendationsGiven(authorTeamId, {
          page: query.page,
          perPage: query.perPage,
        })
      : await this.repo.findPlayerRecommendationsGiven(authorProfileId!, {
          page: query.page,
          perPage: query.perPage,
        });

    return {
      data: {
        items: plainToInstance(RecommendationPresenter, items, { excludeExtraneousValues: true }),
        ratingAverage,
        ratingCount,
        ratingSum,
      },
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
      },
    };
  }
}
