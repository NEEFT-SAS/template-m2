import { Inject, Injectable } from '@nestjs/common';
import { DeleteTeamDTO, toLowerCaseTrim } from '@neeft-sas/shared';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '../../ports/team.repository.port';
import { TeamNotFoundError, TeamSlugMismatchError } from '../../../domain/errors/team.errors';

@Injectable()
export class DeleteTeamUseCase {
  constructor(@Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort) {}

  async execute(teamId: string, dto: DeleteTeamDTO): Promise<void> {
    const team = await this.repo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const providedSlug = toLowerCaseTrim(dto.slug ?? '');
    const teamSlug = toLowerCaseTrim(team.slug ?? '');
    if (!providedSlug || providedSlug !== teamSlug) {
      throw new TeamSlugMismatchError(teamId, dto.slug ?? '');
    }

    await this.repo.deleteTeam(teamId);
  }
}
