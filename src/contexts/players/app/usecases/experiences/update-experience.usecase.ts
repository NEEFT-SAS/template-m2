import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerExperiencePresenter, UpdatePlayerExperienceDTO } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerExperienceUpdateInput, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError, PlayerExperienceNotFoundError } from '../../../domain/errors/player-experience.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../../domain/events/player-search-sync.event';

@Injectable()
export class UpdatePlayerExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, experienceId: number, dto: UpdatePlayerExperienceDTO): Promise<PlayerExperiencePresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findExperienceById(profileId, experienceId);
    if (!existing) {
      throw new PlayerExperienceNotFoundError(userSlug, experienceId);
    }

    const nextStartDate = dto.startDate ?? existing.startDate;
    const nextEndDate = dto.endDate !== undefined ? dto.endDate : existing.endDate;

    if (nextEndDate && nextStartDate && nextEndDate < nextStartDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: nextStartDate, endDate: nextEndDate });
    }

    const updates: PlayerExperienceUpdateInput = {};
    if (dto.teamName !== undefined) updates.teamName = dto.teamName ?? null;
    if (dto.jobTitle !== undefined) updates.jobTitle = dto.jobTitle;
    if (dto.description !== undefined) updates.description = dto.description ?? null;
    if (dto.startDate !== undefined) updates.startDate = dto.startDate;
    if (dto.endDate !== undefined) updates.endDate = dto.endDate ?? null;

    if (!Object.keys(updates).length) {
      return plainToInstance(PlayerExperiencePresenter, existing, { excludeExtraneousValues: true });
    }

    const updated = await this.repo.updateExperience(profileId, experienceId, updates);
    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
    return plainToInstance(PlayerExperiencePresenter, updated, { excludeExtraneousValues: true });
  }
}
