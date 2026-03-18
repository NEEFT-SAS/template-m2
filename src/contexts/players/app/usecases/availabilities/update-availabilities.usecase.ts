import { Inject, Injectable } from '@nestjs/common';
import { PlayerAvailabilityPresenter, PlayerAvailabilityToUpdateDTO } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerAvailabilityDuplicateError } from '../../../domain/errors/player-availability.errors';
import { plainToSharedInstance } from '@/core/utils/shared-transformer';

@Injectable()
export class UpdatePlayerAvailabilitiesUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, availabilities: PlayerAvailabilityToUpdateDTO[]) {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const seen = new Set<string>();
    const duplicates: { weekday: string; slot: string }[] = [];

    for (const availability of availabilities) {
      const key = `${availability.weekday}:${availability.slot}`;
      if (seen.has(key)) {
        duplicates.push({ weekday: availability.weekday, slot: availability.slot });
        continue;
      }
      seen.add(key);
    }

    if (duplicates.length) {
      throw new PlayerAvailabilityDuplicateError(userSlug, duplicates);
    }

    const newAvailabilities = await this.repo.replaceAvailabilities(profileId, availabilities);
    return plainToSharedInstance(PlayerAvailabilityPresenter, newAvailabilities, { excludeExtraneousValues: true });
  }
}
