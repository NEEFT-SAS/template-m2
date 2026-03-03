import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerGameNotFoundError } from '@/contexts/players/domain/errors/player-game.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';

@Injectable()
export class DeletePlayerGameUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, rscGameId: number): Promise<void> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerGameIdByProfileAndGame(profileId, rscGameId);
    if (!existing) {
      throw new PlayerGameNotFoundError(userSlug, rscGameId);
    }

    await this.repo.deletePlayerGame(profileId, rscGameId);
    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
  }
}
