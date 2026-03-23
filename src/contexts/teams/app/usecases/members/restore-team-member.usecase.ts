import { Inject, Injectable } from '@nestjs/common';
import { TeamMemberPresenter, TeamMemberRole, RestoreTeamMemberDto } from '@neeft-sas/shared';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberAlreadyExistsError,
  TeamMemberEditPermissionError,
  TeamMemberIllegalPermissionGrantError,
  TeamMemberManagePermissionError,
  TeamMemberNotFoundError,
  TeamMemberProfileNotFoundError,
  TeamMemberRoleForbiddenError,
  TeamNotFoundError,
} from '../../../domain/errors/team.errors';
import { plainToInstance } from 'class-transformer';
import { TeamScoreService } from '../../services/team-score.service';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import { hasPermissions } from '@/core/security/permissions';

const STAFF_ROLE_HIERARCHY: TeamMemberRole[] = [
  'STAFF',
  'ADMIN',
  'OWNER',
];

@Injectable()
export class RestoreTeamMemberUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly teamScoreService: TeamScoreService,
  ) {}

  async execute(
    teamSlug: string,
    dto: RestoreTeamMemberDto,
    requesterProfileId: string
  ): Promise<TeamMemberPresenter> {
    const team = await this.repo.findTeamBySlug(teamSlug);
    if (!team) {
      throw new TeamNotFoundError(teamSlug);
    }

    const requester = await this.repo.findTeamMemberByProfile(team.id, requesterProfileId);
    if (!this.repo.ensureTeamMemberIsValid(requester)) {
      throw new TeamMemberNotFoundError(team.id, requesterProfileId);
    }

    const profile = await this.repo.findProfileBySlug(dto.profileSlug);
    if (!profile) {
      throw new TeamMemberProfileNotFoundError(dto.profileSlug);
    }

    const existing = await this.repo.findTeamMemberByProfile(
      team.id,
      profile.id,
    );
    if (existing) {
        throw new TeamMemberAlreadyExistsError(team.id, profile.id);
    }

    const isOwner = requesterProfileId == team.owner.id;
    const canManageMembers = hasPermissions(requester.permissions ?? 0n, TEAM_MEMBER_PERMISSIONS.MANAGE_MEMBERS) || isOwner;

    if (!canManageMembers) {
      throw new TeamMemberManagePermissionError(team.id, requesterProfileId);
    }

    existing.permissions = 0n; // Reset permissions for the restored member
    existing.deletedAt = null; // Restore the member by clearing the deletedAt timestamp
    existing.role = 'OTHER';
    existing.status = 'current';

    const updated = await this.repo.saveTeamMemberEntity(existing);

    await this.teamScoreService.recomputeTeamScores(team.id);

    return plainToInstance(TeamMemberPresenter, updated, {
      excludeExtraneousValues: true,
    });
  }
}
