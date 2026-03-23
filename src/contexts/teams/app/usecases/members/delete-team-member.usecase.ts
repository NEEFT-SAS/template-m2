import { Inject, Injectable } from '@nestjs/common';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberCannotDeleteOwnerError,
  TeamMemberNotFoundError,
  TeamMemberRoleForbiddenError,
  TeamNotFoundError,
} from '../../../domain/errors/team.errors';
import { TeamMemberRole } from '@neeft-sas/shared';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import { hasPermissions } from '@/core/security/permissions';

/**
 * Staff-level role hierarchy — higher index = higher authority.
 * Only an actor with strictly higher authority can remove a member.
 */
const STAFF_ROLE_HIERARCHY: TeamMemberRole[] = [
  'STAFF',
  'ADMIN',
  'OWNER',
];

const roleLevel = (role: TeamMemberRole | null | undefined): number => {
  const idx = STAFF_ROLE_HIERARCHY.indexOf(role as TeamMemberRole);
  return idx === -1 ? 0 : idx;
};

@Injectable()
export class DeleteTeamMemberUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
  ) {}

  /**
   * @param teamSlug       The team
   * @param actorMemberId  The team member performing the deletion
   * @param targetMemberId The member being removed
   */
  async execute(
    teamSlug: string,
    targetMemberId: string,
    requesterProfileId: string
  ): Promise<void> {
    const team = await this.repo.findTeamBySlug(teamSlug);
    if (!team) throw new TeamNotFoundError(teamSlug);

    const requester = await this.repo.findTeamMemberByProfile(team.id, requesterProfileId);
    if (!this.repo.ensureTeamMemberIsValid(team.id, requester)) {
      throw new TeamMemberNotFoundError(team.id, requesterProfileId);
    }
    const target = await this.repo.findTeamMemberWithProfile(team.id, targetMemberId);
    if (!this.repo.ensureTeamMemberIsValid(team.id, target)) {
      throw new TeamMemberNotFoundError(team.id, targetMemberId);
    }

    // ── 1. Owner cannot be removed ───────────────────────────────────────────
    if (target.role === 'OWNER' || target.profile.id == team.owner.id) {
      throw new TeamMemberCannotDeleteOwnerError(team.id);
    }

    // ── 2. Self-removal is allowed (non-owner member leaving the team) ───────
    if (requesterProfileId === targetMemberId) {
      await this.repo.deleteTeamMember(team.id, targetMemberId);
      return;
    }

    // ── 3. Requester must strictly outrank the target ────────────────────────────
    const requesterLevel = roleLevel(requester.role);
    const targetLevel = roleLevel(target.role);

    const isOwner = requesterProfileId == team.owner.id;
    const canManageMembers = hasPermissions(BigInt(requester.permissions) ?? 0n, TEAM_MEMBER_PERMISSIONS.MANAGE_MEMBERS) || isOwner;
    
    if(!canManageMembers) {
      throw new TeamMemberRoleForbiddenError(
        requester.role ?? 'OTHER',
        target.role ?? 'OTHER',
      );
    }

    if (requesterLevel <= targetLevel && !isOwner) {
      throw new TeamMemberRoleForbiddenError(
        requester.role ?? 'OTHER',
        target.role ?? 'OTHER',
      );
    }


    await this.repo.deleteTeamMember(team.id, targetMemberId);
  }
}
