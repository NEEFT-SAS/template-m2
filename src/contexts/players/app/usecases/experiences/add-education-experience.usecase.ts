import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreatePlayerEducationExperienceDTO, PlayerEducationExperiencePresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError } from '../../../domain/errors/player-experience.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../../domain/events/player-search-sync.event';

@Injectable()
export class AddPlayerEducationExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
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
      schoolName: dto.schoolName,
      schoolLogoUrl: dto.schoolLogoUrl ?? null,
      diplomaName: dto.diplomaName,
      description: dto.description ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      location: dto.location ?? null,
      educationStatus: dto.educationStatus ?? null,
      attendanceMode: dto.attendanceMode ?? null,
      mention: dto.mention ?? null,
    });

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));

    return plainToInstance(PlayerEducationExperiencePresenter, experience, { excludeExtraneousValues: true });
  }
}
