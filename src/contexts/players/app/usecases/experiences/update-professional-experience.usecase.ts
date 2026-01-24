import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerProfessionalExperiencePresenter, UpdatePlayerProfessionalExperienceDTO } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerProfessionalExperienceUpdateInput, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError, PlayerExperienceNotFoundError } from '../../../domain/errors/player-experience.errors';

@Injectable()
export class UpdatePlayerProfessionalExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, experienceId: number, dto: UpdatePlayerProfessionalExperienceDTO): Promise<PlayerProfessionalExperiencePresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findProfessionalExperienceById(profileId, experienceId);
    if (!existing) {
      throw new PlayerExperienceNotFoundError(userSlug, experienceId);
    }

    const nextStartDate = dto.startDate !== undefined ? dto.startDate : existing.startDate;
    const nextEndDate = dto.endDate !== undefined ? dto.endDate : existing.endDate;

    if (nextEndDate && nextStartDate && nextEndDate < nextStartDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: nextStartDate, endDate: nextEndDate });
    }

    const updates: PlayerProfessionalExperienceUpdateInput = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.company !== undefined) updates.company = dto.company;
    if (dto.location !== undefined) updates.location = dto.location ?? null;
    if (dto.contractType !== undefined) updates.contractType = dto.contractType ?? null;
    if (dto.startDate !== undefined) updates.startDate = dto.startDate ?? null;
    if (dto.endDate !== undefined) updates.endDate = dto.endDate ?? null;
    if (dto.ongoing !== undefined) updates.ongoing = dto.ongoing;
    if (dto.description !== undefined) updates.description = dto.description ?? null;

    if (!Object.keys(updates).length) {
      return plainToInstance(PlayerProfessionalExperiencePresenter, existing, { excludeExtraneousValues: true });
    }

    const updated = await this.repo.updateProfessionalExperience(profileId, experienceId, updates);
    return plainToInstance(PlayerProfessionalExperiencePresenter, updated, { excludeExtraneousValues: true });
  }
}
