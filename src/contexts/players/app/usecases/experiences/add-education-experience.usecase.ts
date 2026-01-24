import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreatePlayerEducationExperienceDTO, PlayerEducationExperiencePresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError } from '../../../domain/errors/player-experience.errors';

@Injectable()
export class AddPlayerEducationExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, dto: CreatePlayerEducationExperienceDTO): Promise<PlayerEducationExperiencePresenter> {
    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: dto.startDate, endDate: dto.endDate });
    }

    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const experience = await this.repo.addEducationExperience(profileId, {
      title: dto.title,
      school: dto.school,
      location: dto.location ?? null,
      fieldOfStudy: dto.fieldOfStudy ?? null,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      ongoing: dto.ongoing ?? false,
      description: dto.description ?? null,
    });

    return plainToInstance(PlayerEducationExperiencePresenter, experience, { excludeExtraneousValues: true });
  }
}
