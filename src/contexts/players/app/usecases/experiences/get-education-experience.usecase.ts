import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerEducationExperiencePresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceNotFoundError } from '../../../domain/errors/player-experience.errors';

@Injectable()
export class GetPlayerEducationExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, experienceId: string): Promise<PlayerEducationExperiencePresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const experience = await this.repo.findEducationExperienceById(profileId, experienceId);
    if (!experience) {
      throw new PlayerExperienceNotFoundError(userSlug, experienceId);
    }

    return plainToInstance(PlayerEducationExperiencePresenter, experience, { excludeExtraneousValues: true });
  }
}
