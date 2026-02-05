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
  ) {}

  async execute(
    targetSlug: string,
    query: { page: number; perPage: number },
    viewer: { pid?: string; slug?: string; roles?: string[] } | undefined,
  ): Promise<ListPlayerRecommendationsResult> {
    const targetProfileId = await this.repo.findProfileIdBySlug(targetSlug);
    if (!targetProfileId) {
      throw new PlayerNotFoundError(targetSlug);
    }

    const { items, total, ratingAverage, ratingCount, ratingSum } = await this.repo.findPlayerRecommendationsReceived(targetProfileId, {
      page: query.page,
      perPage: query.perPage,
    });

    const requesterProfileId = viewer?.pid ?? '';
    const hasAlreadyRecommended =
      !!requesterProfileId &&
      requesterProfileId !== targetProfileId &&
      (await this.repo.existsPlayerToPlayerRecommendation(requesterProfileId, targetProfileId));

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
