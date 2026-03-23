import { Inject, Injectable } from '@nestjs/common';
import { CreateTeamMemberDTO, TeamMemberPresenter, TeamMemberRole } from '@neeft-sas/shared';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberAlreadyExistsError,
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
export class CreateTeamMemberUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly teamScoreService: TeamScoreService,
  ) {}

  async execute(
    teamSlug: string,
    dto: CreateTeamMemberDTO,
    requesterProfileId: string
  ): Promise<TeamMemberPresenter> {
    const team = await this.repo.findTeamBySlug(teamSlug);
    if (!team) {
      throw new TeamNotFoundError(teamSlug);
    }

    const requester = await this.repo.findTeamMemberByProfile(team.id, requesterProfileId);
    if (!requester) {
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
    const canManagePermissions = hasPermissions(requester.permissions ?? 0n, TEAM_MEMBER_PERMISSIONS.MANAGE_PERMISSIONS) || isOwner;

    if (!canManageMembers) {
      throw new TeamMemberManagePermissionError(team.id, requesterProfileId);
    }
    if(!canManagePermissions && dto.permissions !== undefined && dto.permissions !== 0n) {
      throw new TeamMemberIllegalPermissionGrantError(dto.permissions);
    }
    const desiredRoleLevel = STAFF_ROLE_HIERARCHY.indexOf(dto.role as TeamMemberRole);
    const requesterRoleLevel = STAFF_ROLE_HIERARCHY.indexOf(requester.role as TeamMemberRole);
    if(desiredRoleLevel > requesterRoleLevel) {
      throw new TeamMemberRoleForbiddenError(
        requester.role ?? 'OTHER',
        dto.role ?? 'OTHER',
      );
    }

    const created = await this.repo.createTeamMember(team.id, {
      profileId: profile.id,
      role: dto.role ?? null,
      title: dto.title ?? null,
      isHidden: dto.isHidden ?? false,
      permissions: dto.permissions ?? 0n,
    });

    await this.teamScoreService.recomputeTeamScores(team.id);

    return plainToInstance(TeamMemberPresenter, created, {
      excludeExtraneousValues: true,
    });
  }
}
