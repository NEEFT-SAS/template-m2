import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '../../ports/team.repository.port';
import { TeamNotFoundError } from '../../../domain/errors/team.errors';
import { TeamPrivateProfilePresenter, TeamPresenter } from '@/typage';
import { TeamEntity } from '../../../infra/entities/team.entity';

@Injectable()
export class GetTeamProfileUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
  ) {}

  async execute(slug: string): Promise<TeamPresenter> {
    const team = await this.loadTeamBySlug(slug);
    return plainToInstance(TeamPresenter, team, { excludeExtraneousValues: true });
  }

  async executePrivate(slug: string, profileId: string): Promise<TeamPrivateProfilePresenter> {
    const team = await this.loadTeamBySlug(slug);
    const member = profileId
      ? await this.repo.findTeamMemberByProfile(team.id, profileId)
      : null;

    return plainToInstance(
      TeamPrivateProfilePresenter,
      {
        ...team,
        permissions: member?.permissions ?? null,
      },
      { excludeExtraneousValues: true },
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
