import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreatePlayerExperienceDTO, PlayerExperiencePresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceInvalidDatesError } from '../../../domain/errors/player-experience.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../../domain/events/player-search-sync.event';

@Injectable()
export class AddPlayerExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, dto: CreatePlayerExperienceDTO): Promise<PlayerExperiencePresenter> {
    if (dto.endDate && dto.endDate < dto.startDate) {
      throw new PlayerExperienceInvalidDatesError({ startDate: dto.startDate, endDate: dto.endDate });
    }

    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const experience = await this.repo.addExperience(profileId, {
      teamName: dto.teamName ?? null,
      jobTitle: dto.jobTitle,
      description: dto.description ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
    });

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));

    return plainToInstance(PlayerExperiencePresenter, experience, { excludeExtraneousValues: true });
  }
}
