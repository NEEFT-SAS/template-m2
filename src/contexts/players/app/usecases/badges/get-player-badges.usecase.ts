import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { PlayerBadgesPresenter } from '@neeft-sas/shared';

import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerBadgesResolver } from '../../services/player-badges.resolver';

@Injectable()
export class GetPlayerBadgesUsecase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resolver: PlayerBadgesResolver,
  ) {}

  async execute(userSlug: string): Promise<PlayerBadgesPresenter[]> {
    const ctx = await this.repo.findPlayerBadgeContextBySlug(userSlug);
    if (!ctx) throw new PlayerNotFoundError(userSlug);

    const assignedIds = await this.repo.findAssignedBadgeIds(ctx.userProfileId);

    const badges = this.resolver.resolve({
      assignedRscBadgeIds: assignedIds,
      profileCreatedAt: ctx.profileCreatedAt,
      isEmailVerified: ctx.isEmailVerified,
    });

    return plainToInstance(PlayerBadgesPresenter, badges);
  }
}
