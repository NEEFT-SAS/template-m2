import { Inject, Injectable } from '@nestjs/common';

import { PlayerSocialLinkPresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { plainToSharedInstance } from '@/core/utils/shared-transformer';

@Injectable()
export class GetPlayerSocialLinksUsecase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string): Promise<PlayerSocialLinkPresenter[]> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const links = await this.repo.findSocialLinks(profileId);

    return plainToSharedInstance(PlayerSocialLinkPresenter, links, {
      excludeExtraneousValues: true,
    });
  }
}
