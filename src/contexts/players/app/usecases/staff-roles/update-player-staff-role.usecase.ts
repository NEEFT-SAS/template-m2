import { Inject, Injectable } from '@nestjs/common';
import {
  PLAYER_REPOSITORY,
  PlayerRepositoryPort,
  PlayerStaffRoleUpdateInput,
} from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerStaffRoleNotFoundError } from '@/contexts/players/domain/errors/player-staff-role.errors';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerStaffRoleResponse } from '@/contexts/players/api/presenters/player-staff-role.response';
import { toPlayerStaffRoleResponse } from '../../services/player-staff-role-response.mapper';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';
import { UpdatePlayerStaffRoleDTO } from '@/contexts/players/api/dtos/player-staff-role.dto';

@Injectable()
export class UpdatePlayerStaffRoleUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    userSlug: string,
    roleId: string,
    dto: UpdatePlayerStaffRoleDTO,
  ): Promise<PlayerStaffRoleResponse> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerStaffRoleByProfileAndRole(
      profileId,
      roleId,
    );
    if (!existing) {
      throw new PlayerStaffRoleNotFoundError(userSlug, roleId);
    }

    const role =
      this.resourcesStore
        .getSnapshot()
        .rscStaffRoles.find((item) => item.id === existing.roleKey) ?? null;

    const updates: PlayerStaffRoleUpdateInput = {};
    if (dto.payload !== undefined) updates.payload = dto.payload ?? null;

    if (!Object.keys(updates).length) {
      return toPlayerStaffRoleResponse(existing, role);
    }

    const updated = await this.repo.updatePlayerStaffRole(
      profileId,
      roleId,
      updates,
    );

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
    return toPlayerStaffRoleResponse(updated, role);
  }
}
