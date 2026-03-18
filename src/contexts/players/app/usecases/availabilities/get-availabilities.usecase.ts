import { Inject, Injectable } from '@nestjs/common';
import { PlayerAvailabilityPresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { plainToSharedInstance } from '@/core/utils/shared-transformer';

@Injectable()
export class GetPlayerAvailabilitiesUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string): Promise<PlayerAvailabilityPresenter[]> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const availabilities = await this.repo.findAvailabilities(profileId);

    return plainToSharedInstance(PlayerAvailabilityPresenter, availabilities, {
      excludeExtraneousValues: true,
    });
  }
}
