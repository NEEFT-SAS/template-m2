import { Inject, Injectable } from '@nestjs/common';
import {
  PLAYER_REPOSITORY,
  PlayerRepositoryPort,
} from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerStaffRoleNotFoundError } from '@/contexts/players/domain/errors/player-staff-role.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';

@Injectable()
export class DeletePlayerStaffRoleUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, roleId: string): Promise<void> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerStaffRoleIdByProfileAndRole(
      profileId,
      roleId,
    );
    if (!existing) {
      throw new PlayerStaffRoleNotFoundError(userSlug, roleId);
    }

    await this.repo.deletePlayerStaffRole(profileId, roleId);
    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
  }
}
