import { Inject, Injectable } from '@nestjs/common';
import {
  PLAYER_REPOSITORY,
  PlayerRepositoryPort,
} from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { PlayerStaffRoleNotFoundError } from '@/contexts/players/domain/errors/player-staff-role.errors';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerStaffRoleResponse } from '@/contexts/players/api/presenters/player-staff-role.response';
import { toPlayerStaffRoleResponse } from '../../services/player-staff-role-response.mapper';

@Injectable()
export class GetPlayerStaffRoleUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(userSlug: string, roleId: string): Promise<PlayerStaffRoleResponse> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const staffRole = await this.repo.findPlayerStaffRoleByProfileAndRole(
      profileId,
      roleId,
    );
    if (!staffRole) {
      throw new PlayerStaffRoleNotFoundError(userSlug, roleId);
    }

    const role =
      this.resourcesStore
        .getSnapshot()
        .rscStaffRoles.find((item) => item.id === staffRole.roleKey) ?? null;

    return toPlayerStaffRoleResponse(staffRole, role);
  }
}
