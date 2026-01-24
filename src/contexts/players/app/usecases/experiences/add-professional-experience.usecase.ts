import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreatePlayerProfessionalExperienceDTO, PlayerProfessionalExperiencePresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError } from '../../../domain/errors/player-experience.errors';

@Injectable()
export class AddPlayerProfessionalExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, dto: CreatePlayerProfessionalExperienceDTO): Promise<PlayerProfessionalExperiencePresenter> {
    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: dto.startDate, endDate: dto.endDate });
    }

    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const experience = await this.repo.addProfessionalExperience(profileId, {
      title: dto.title,
      company: dto.company,
      location: dto.location ?? null,
      contractType: dto.contractType ?? null,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      ongoing: dto.ongoing ?? false,
      description: dto.description ?? null,
    });

    return plainToInstance(PlayerProfessionalExperiencePresenter, experience, { excludeExtraneousValues: true });
  }
}
