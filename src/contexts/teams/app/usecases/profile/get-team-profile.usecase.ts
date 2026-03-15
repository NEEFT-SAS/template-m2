import { Inject, Injectable } from '@nestjs/common';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import { TeamNotFoundError } from '../../../domain/errors/team.errors';
import { TeamPrivateProfilePresenter, TeamPresenter } from '@/typage';
import { TeamEntity } from '../../../infra/entities/team.entity';
import { TeamScoreService } from '../../services/team-score.service';
import {
  mapTeamPrivateResponse,
  mapTeamResponse,
} from '../../services/team-response.mapper';

@Injectable()
export class GetTeamProfileUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly teamScoreService: TeamScoreService,
  ) {}

  async execute(slug: string): Promise<TeamPresenter> {
    const team = await this.loadTeamBySlug(slug);
    return mapTeamResponse(team, this.teamScoreService);
  }

  async executePrivate(
    slug: string,
    profileId: string,
  ): Promise<TeamPrivateProfilePresenter> {
    const team = await this.loadTeamBySlug(slug);
    const member = profileId
      ? await this.repo.findTeamMemberByProfile(team.id, profileId)
      : null;

    return mapTeamPrivateResponse(
      team,
      member?.permissions ?? null,
      this.teamScoreService,
    );
  }

  private async loadTeamBySlug(slug: string): Promise<TeamEntity> {
    const team = await this.repo.findTeamBySlug(slug);
    if (!team) {
      throw new TeamNotFoundError(slug);
    }

    return team;
  }
}
