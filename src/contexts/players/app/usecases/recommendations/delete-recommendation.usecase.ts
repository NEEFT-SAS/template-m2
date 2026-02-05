import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { RecommendationForbiddenError, RecommendationNotFoundError } from '../../../domain/errors/recommendation.errors';

@Injectable()
export class DeleteRecommendationUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(recommendationId: string, requesterProfileId: string, isAdmin: boolean): Promise<void> {
    const recommendation = await this.repo.findRecommendationSnapshotById(recommendationId);
    if (!recommendation) {
      throw new RecommendationNotFoundError(recommendationId);
    }

    if (!isAdmin) {
      const isOwner = recommendation.authorProfileId && recommendation.authorProfileId === requesterProfileId;
      if (!isOwner) {
        throw new RecommendationForbiddenError(recommendationId);
      }
    }

    await this.repo.deleteRecommendation(recommendationId);
  }
}
