import { Inject, Injectable } from '@nestjs/common';
import {
  PLAYER_REPOSITORY,
  PlayerRepositoryPort,
} from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerStaffRoleResponse } from '@/contexts/players/api/presenters/player-staff-role.response';
import { toPlayerStaffRoleResponse } from '../../services/player-staff-role-response.mapper';

@Injectable()
export class GetPlayerStaffRolesUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(userSlug: string): Promise<PlayerStaffRoleResponse[]> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const roles = await this.repo.findPlayerStaffRoles(profileId);
    const resourcesById = new Map(
      this.resourcesStore
        .getSnapshot()
        .rscStaffRoles.map((item) => [item.id, item]),
    );

    return roles.map((role) =>
      toPlayerStaffRoleResponse(role, resourcesById.get(role.roleKey) ?? null),
    );
  }
}
