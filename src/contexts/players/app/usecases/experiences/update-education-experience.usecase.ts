import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerEducationExperiencePresenter, UpdatePlayerEducationExperienceDTO } from '@neeft-sas/shared';
import {
  PLAYER_REPOSITORY,
  PlayerEducationExperienceUpdateInput,
  PlayerRepositoryPort,
} from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError, PlayerExperienceNotFoundError } from '../../../domain/errors/player-experience.errors';

@Injectable()
export class UpdatePlayerEducationExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, experienceId: number, dto: UpdatePlayerEducationExperienceDTO): Promise<PlayerEducationExperiencePresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findEducationExperienceById(profileId, experienceId);
    if (!existing) {
      throw new PlayerExperienceNotFoundError(userSlug, experienceId);
    }

    const nextStartDate = dto.startDate !== undefined ? dto.startDate : existing.startDate;
    const nextEndDate = dto.endDate !== undefined ? dto.endDate : existing.endDate;

    if (nextEndDate && nextStartDate && nextEndDate < nextStartDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: nextStartDate, endDate: nextEndDate });
    }

    const updates: PlayerEducationExperienceUpdateInput = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.school !== undefined) updates.school = dto.school;
    if (dto.location !== undefined) updates.location = dto.location ?? null;
    if (dto.fieldOfStudy !== undefined) updates.fieldOfStudy = dto.fieldOfStudy ?? null;
    if (dto.startDate !== undefined) updates.startDate = dto.startDate ?? null;
    if (dto.endDate !== undefined) updates.endDate = dto.endDate ?? null;
    if (dto.ongoing !== undefined) updates.ongoing = dto.ongoing;
    if (dto.description !== undefined) updates.description = dto.description ?? null;

    if (!Object.keys(updates).length) {
      return plainToInstance(PlayerEducationExperiencePresenter, existing, { excludeExtraneousValues: true });
    }

    const updated = await this.repo.updateEducationExperience(profileId, experienceId, updates);
    return plainToInstance(PlayerEducationExperiencePresenter, updated, { excludeExtraneousValues: true });
  }
}
