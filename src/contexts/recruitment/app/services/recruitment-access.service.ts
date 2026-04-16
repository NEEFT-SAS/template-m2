import { Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';
import { hasPermissions } from '@/core/security/permissions';
import { RecruitmentAccessDeniedError } from '../../domain/errors/recruitment.errors';

@Injectable()
export class RecruitmentAccessService {
  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepo: TeamRepositoryPort,
  ) {}

  async ensureCanManageRecruitment(recruitment: any, requesterProfileId: string): Promise<void> {
    const teamId = String(recruitment?.teamId ?? recruitment?.team?.id ?? '').trim();
    if (!teamId) {
      throw new TeamNotFoundError(teamId);
    }

    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    if (team.owner?.id === requesterProfileId) {
      return;
    }

    const member = await this.teamRepo.findTeamMemberByProfile(team.id, requesterProfileId);
    const rawPermissions = member?.permissions ?? 0;
    const permissions = typeof rawPermissions === 'bigint' ? rawPermissions : BigInt(rawPermissions);
    if (member && this.teamRepo.ensureTeamMemberIsValid(member) && hasPermissions(permissions, TEAM_MEMBER_PERMISSIONS.MANAGE_RECRUITMENT)) {
      return;
    }

    throw new RecruitmentAccessDeniedError();
  }
}
