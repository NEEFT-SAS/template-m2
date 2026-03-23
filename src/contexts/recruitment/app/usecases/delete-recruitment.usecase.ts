import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '@/contexts/teams/app/ports/team.repository.port';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import { RecruitmentAccessDeniedError, RecruitmentNotFoundError } from '../../domain/errors/recruitment.errors';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';

@Injectable()
export class DeleteRecruitmentUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepo: TeamRepositoryPort,
  ) { }

  async execute(requesterProfileId: string, id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new RecruitmentNotFoundError(id);
    }

    const teamId = existing.teamId;

    // Permission check
    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const isOwner = team.owner?.id === requesterProfileId;
    let hasPermission = isOwner;

    if (!isOwner) {
      const member = await this.teamRepo.findTeamMemberByProfile(teamId, requesterProfileId);
      if (member && (member.permissions & TEAM_MEMBER_PERMISSIONS.MANAGE_RECRUITMENT)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new RecruitmentAccessDeniedError();
    }

    await this.repo.delete(id);
    return { deleted: true };
  }
}
