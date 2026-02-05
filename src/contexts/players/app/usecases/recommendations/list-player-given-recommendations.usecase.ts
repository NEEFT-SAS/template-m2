import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RecommendationPresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';

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
  ) {}

  async execute(
    authorSlug: string,
    query: { page: number; perPage: number },
    _viewer: { slug?: string; roles?: string[] } | undefined,
  ): Promise<ListPlayerRecommendationsResult> {
    const authorProfileId = await this.repo.findProfileIdBySlug(authorSlug);
    if (!authorProfileId) {
      throw new PlayerNotFoundError(authorSlug);
    }

    const { items, total, ratingAverage, ratingCount, ratingSum } = await this.repo.findPlayerRecommendationsGiven(authorProfileId, {
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
