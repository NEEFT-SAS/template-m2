import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerExperienceNotFoundError } from '../../../domain/errors/player-experience.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '../../../domain/events/player-search-sync.event';

@Injectable()
export class DeletePlayerExperienceUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, experienceId: number): Promise<void> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findExperienceById(profileId, experienceId);
    if (!existing) {
      throw new PlayerExperienceNotFoundError(userSlug, experienceId);
    }

    await this.repo.deleteExperience(profileId, experienceId);
    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
  }
}
