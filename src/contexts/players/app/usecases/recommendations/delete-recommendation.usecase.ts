import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';
import { RecommendationForbiddenError, RecommendationNotFoundError } from '../../../domain/errors/recommendation.errors';

@Injectable()
export class DeleteRecommendationUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
  ) {}

  async execute(recommendationId: string, requesterProfileId: string, isAdmin: boolean): Promise<void> {
    const recommendation = await this.repo.findRecommendationSnapshotById(recommendationId);
    if (!recommendation) {
      throw new RecommendationNotFoundError(recommendationId);
    }

    if (!isAdmin) {
      const requesterId = requesterProfileId ?? '';
      if (!requesterId) {
        throw new RecommendationForbiddenError(recommendationId);
      }

      const isAuthorProfile = recommendation.authorProfileId === requesterId;
      const isTargetProfile = recommendation.targetProfileId === requesterId;

      let isAuthorTeamOwner = false;
      if (recommendation.authorTeamId) {
        const authorTeam = await this.teamRepo.findTeamById(recommendation.authorTeamId);
        isAuthorTeamOwner = !!authorTeam && authorTeam.owner?.id === requesterId;
      }

      let isTargetTeamOwner = false;
      if (recommendation.targetTeamId) {
        const targetTeam = await this.teamRepo.findTeamById(recommendation.targetTeamId);
        isTargetTeamOwner = !!targetTeam && targetTeam.owner?.id === requesterId;
      }

      if (!isAuthorProfile && !isTargetProfile && !isAuthorTeamOwner && !isTargetTeamOwner) {
        throw new RecommendationForbiddenError(recommendationId);
      }
    }

    await this.repo.deleteRecommendation(recommendationId);
  }
}
