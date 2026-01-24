import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerEducationExperiencePresenter, UpdatePlayerEducationExperienceDTO } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerEducationExperienceUpdateInput, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError, PlayerExperienceNotFoundError } from '../../../domain/errors/player-experience.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../../domain/events/player-search-sync.event';

@Injectable()
export class UpdatePlayerEducationExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, experienceId: string, dto: UpdatePlayerEducationExperienceDTO): Promise<PlayerEducationExperiencePresenter> {
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
    if (dto.schoolName !== undefined) updates.schoolName = dto.schoolName;
    if (dto.schoolLogoUrl !== undefined) updates.schoolLogoUrl = dto.schoolLogoUrl ?? null;
    if (dto.diplomaName !== undefined) updates.diplomaName = dto.diplomaName;
    if (dto.description !== undefined) updates.description = dto.description ?? null;
    if (dto.startDate !== undefined) updates.startDate = dto.startDate;
    if (dto.endDate !== undefined) updates.endDate = dto.endDate ?? null;
    if (dto.location !== undefined) updates.location = dto.location ?? null;
    if (dto.educationStatus !== undefined) updates.educationStatus = dto.educationStatus ?? null;
    if (dto.attendanceMode !== undefined) updates.attendanceMode = dto.attendanceMode ?? null;
    if (dto.mention !== undefined) updates.mention = dto.mention ?? null;

    if (!Object.keys(updates).length) {
      return plainToInstance(PlayerEducationExperiencePresenter, existing, { excludeExtraneousValues: true });
    }

    const updated = await this.repo.updateEducationExperience(profileId, experienceId, updates);
    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
    return plainToInstance(PlayerEducationExperiencePresenter, updated, { excludeExtraneousValues: true });
  }
}
