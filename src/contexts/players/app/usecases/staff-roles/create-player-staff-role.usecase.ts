import { Inject, Injectable } from '@nestjs/common';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import {
  PlayerStaffRoleAlreadyExistsError,
  PlayerStaffRoleInvalidRoleError,
} from '@/contexts/players/domain/errors/player-staff-role.errors';
import {
  PLAYER_REPOSITORY,
  PlayerRepositoryPort,
} from '../../ports/player.repository.port';
import { PlayerStaffRoleResponse } from '@/contexts/players/api/presenters/player-staff-role.response';
import { toPlayerStaffRoleResponse } from '../../services/player-staff-role-response.mapper';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';
import { CreatePlayerStaffRoleDTO } from '@/contexts/players/api/dtos/player-staff-role.dto';

@Injectable()
export class CreatePlayerStaffRoleUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(
    userSlug: string,
    dto: CreatePlayerStaffRoleDTO,
  ): Promise<PlayerStaffRoleResponse> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerStaffRoleIdByProfileAndRole(
      profileId,
      dto.roleId,
    );
    if (existing) {
      throw new PlayerStaffRoleAlreadyExistsError(userSlug, dto.roleId);
    }

    const role =
      this.resourcesStore
        .getSnapshot()
        .rscStaffRoles.find((item) => item.id === dto.roleId) ?? null;
    if (!role) {
      throw new PlayerStaffRoleInvalidRoleError(userSlug, dto.roleId);
    }

    const created = await this.repo.createPlayerStaffRole(profileId, {
      roleId: dto.roleId,
      payload: dto.payload ?? null,
    });

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
    return toPlayerStaffRoleResponse(created, role);
  }
}
