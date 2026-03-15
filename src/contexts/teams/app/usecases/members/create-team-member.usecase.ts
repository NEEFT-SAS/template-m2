import { Inject, Injectable } from '@nestjs/common';
import { CreateTeamMemberDTO, TeamMemberPresenter } from '@neeft-sas/shared';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberAlreadyExistsError,
  TeamMemberProfileNotFoundError,
  TeamNotFoundError,
} from '../../../domain/errors/team.errors';
import { plainToInstance } from 'class-transformer';
import { TeamScoreService } from '../../services/team-score.service';

@Injectable()
export class CreateTeamMemberUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly teamScoreService: TeamScoreService,
  ) {}

  async execute(
    teamId: string,
    dto: CreateTeamMemberDTO,
  ): Promise<TeamMemberPresenter> {
    const team = await this.repo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const profile = await this.repo.findProfileBySlug(dto.profileSlug);
    if (!profile) {
      throw new TeamMemberProfileNotFoundError(dto.profileSlug);
    }

    const existing = await this.repo.findTeamMemberByProfile(
      teamId,
      profile.id,
    );
    if (existing) {
      throw new TeamMemberAlreadyExistsError(teamId, profile.id);
    }

    const created = await this.repo.createTeamMember(teamId, {
      profileId: profile.id,
      role: dto.role ?? null,
      title: dto.title ?? null,
      isHidden: dto.isHidden ?? false,
      permissions: dto.permissions ?? 0,
    });

    await this.teamScoreService.recomputeTeamScores(teamId);

    return plainToInstance(TeamMemberPresenter, created, {
      excludeExtraneousValues: true,
    });
  }
}
