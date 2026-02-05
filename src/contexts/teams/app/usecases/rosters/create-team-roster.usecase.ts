import { Inject, Injectable } from '@nestjs/common';
import { CreateTeamRosterDTO, TeamRosterPresenter, slugifyUnique } from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '../../ports/team.repository.port';
import { TeamNotFoundError, TeamRosterInvalidGameError } from '../../../domain/errors/team.errors';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CreateTeamRosterUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(teamId: string, dto: CreateTeamRosterDTO): Promise<TeamRosterPresenter> {
    const team = await this.repo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const snapshot = this.resourcesStore.getSnapshot();
    const game = snapshot.rscGames.find((item) => item.id === dto.gameId);
    if (!game) {
      throw new TeamRosterInvalidGameError(dto.gameId);
    }

    const slug = await slugifyUnique(
      dto.name,
      async (candidate) => this.repo.existsRosterSlug(teamId, candidate),
      { allowBaseSlug: true, suffixDigits: 4, maxRetries: 12 },
    );

    const created = await this.repo.createRoster(teamId, {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      gameId: dto.gameId,
      isActive: dto.isActive ?? true,
    });

    return plainToInstance(TeamRosterPresenter, created, { excludeExtraneousValues: true });
  }
}
