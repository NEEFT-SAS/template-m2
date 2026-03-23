import { Inject, Injectable } from '@nestjs/common';
import { TeamMemberPresenter, TeamMemberRole, UpdateTeamMemberDTO } from '@neeft-sas/shared';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberCannotEditSelfError,
  TeamMemberEditPermissionError,
  TeamMemberIllegalPermissionGrantError,
  TeamMemberIllegalPermissionRevokeError,
  TeamMemberNotFoundError,
  TeamMemberOwnerImmutableError,
  TeamMemberRoleForbiddenError,
  TeamNotFoundError,
} from '../../../domain/errors/team.errors';
import { TEAM_MEMBER_PERMISSIONS, TEAM_MEMBER_PERMISSIONS_ALL } from '../../../domain/team-member.permissions';
import { plainToInstance } from 'class-transformer';
import { hasPermissions } from '@/core/security/permissions';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';

/**
 * Staff-level role hierarchy — higher index = higher authority.
 * OWNER and ADMIN are "staff-level" roles; only a higher-authority actor
 * can modify a lower-authority member's role.
 */
const STAFF_ROLE_HIERARCHY: TeamMemberRole[] = [
  'STAFF',
  'ADMIN',
  'OWNER',
];

const roleLevel = (role: TeamMemberRole | null | undefined): number => {
  const idx = STAFF_ROLE_HIERARCHY.indexOf(role as TeamMemberRole);
  return idx;
};

@Injectable()
export class UpdateTeamMemberUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
  ) {}

  /**
   * @param teamSlug        The team
   * @param actorMemberId The team member performing the update (must be loaded separately by the controller)
   * @param targetMemberId The member being updated
   * @param dto           Update payload
   */
  async execute(
    teamSlug: string,
    targetMemberId: string,
    dto: UpdateTeamMemberDTO,
    requesterProfileId: string
  ): Promise<TeamMemberPresenter> {
    const team = await this.repo.findTeamBySlug(teamSlug);
    if (!team) throw new TeamNotFoundError(teamSlug);

    const requester = await this.repo.findTeamMemberByProfile(team.id, requesterProfileId);
    console.log('Requester:', requester, requester.status, requester.deletedAt != null, this.repo.ensureTeamMemberIsValid(requester));
    if (!this.repo.ensureTeamMemberIsValid(requester)) throw new TeamMemberNotFoundError(team.id, requesterProfileId);
    const target = await this.repo.findTeamMemberWithProfile(team.id, targetMemberId);
    if (!this.repo.ensureTeamMemberIsValid(target)) throw new TeamMemberNotFoundError(team.id, targetMemberId);

    const isOwner = requesterProfileId == team.owner.id;
    const canManageMembers = hasPermissions(BigInt(requester.permissions) ?? 0n, TEAM_MEMBER_PERMISSIONS.MANAGE_MEMBERS) || isOwner;
    const canManagePermissions = hasPermissions(BigInt(requester.permissions) ?? 0n, TEAM_MEMBER_PERMISSIONS.MANAGE_PERMISSIONS) || isOwner;

    if (dto.role !== undefined && dto.role !== target.role && !canManageMembers) {
      throw new TeamMemberEditPermissionError(team.id, targetMemberId, requesterProfileId);
    }
    
    if (dto.title !== undefined && dto.title !== target.title && !canManageMembers) {
      throw new TeamMemberEditPermissionError(team.id, targetMemberId, requesterProfileId);
    }

    if (dto.permissions !== undefined && dto.permissions !== target.permissions && !canManagePermissions) {
      throw new TeamMemberEditPermissionError(team.id, targetMemberId, requesterProfileId);
    }

    // ── 1. No self-editing of role ────────────────────────────────────────────
    if (requester.id === target.id) {
      if(!canManageMembers) throw new TeamMemberEditPermissionError(team.id, targetMemberId, requesterProfileId);
      if((dto.role != undefined && dto.role != target.role) || (dto.permissions != undefined && dto.permissions != target.permissions) || (dto.isHidden != undefined && dto.isHidden != target.isHidden)) throw new TeamMemberCannotEditSelfError(requester.id);
      if(dto.title !== undefined && dto.title !== target.title && canManageMembers) {
        // Self-editing of title is allowed, but only if it's actually changing
        const updated = await this.repo.updateTeamMember(team.id, targetMemberId, {
          title: dto.title,
        });
        return this.toPresenter(updated ?? target);
      }
      // If no actual changes to title, just return the current state
      return this.toPresenter(target);
    }


    // ── 2. Owner immutability ─────────────────────────────────────────────────
    // Owner's role, permissions and visibility are always at maximum and can only
    // be touched by the owner themselves (to update title only).
    if (target.profile.id === team.owner.id) {
      const isOwnerEditingSelf = requesterProfileId === targetMemberId;
      if (!isOwnerEditingSelf) {
        throw new TeamMemberOwnerImmutableError();
      }
      if(dto.permissions !== undefined && dto.permissions !== target.permissions) {
        throw new TeamMemberOwnerImmutableError();
      }
      if(dto.role !== undefined && dto.role !== target.role) {
        throw new TeamMemberOwnerImmutableError();
      }
      if(dto.isHidden !== undefined && dto.isHidden !== target.isHidden) {
        throw new TeamMemberOwnerImmutableError();
      }
      // Owner editing themselves: only title is allowed
      const updated = await this.repo.updateTeamMember(team.id, targetMemberId, {
        title: dto.title !== undefined ? dto.title : target.title,
        permissions: TEAM_MEMBER_PERMISSIONS_ALL,
        role: 'OWNER',
        isHidden: false,
      });
      return this.toPresenter(updated ?? target);
    }

    // ── 3. Actor role hierarchy check ────────────────────────────────────────
    // Staff-level actors (ADMIN+) can change roles only for members strictly below them.
    const requesterLevel = roleLevel(requester.role);
    const targetLevel = roleLevel(target.role);

    if (dto.role !== undefined) {
      const desiredLevel = roleLevel(dto.role as TeamMemberRole);

      // Requester must outrank the current target role
      if (requesterLevel < targetLevel) {
        throw new TeamMemberRoleForbiddenError(
          requester.role ?? 'OTHER',
          target.role ?? 'OTHER',
        );
      }

      // Requester cannot elevate target to a role equal or above their own
      if (desiredLevel > requesterLevel && dto.role !== null) {
        throw new TeamMemberRoleForbiddenError(
          requester.role ?? 'OTHER',
          dto.role as string,
        );
      }
    }

    // ── 4. Permission guard: illegal add / illegal remove ────────────────────
    if (dto.permissions !== undefined && dto.permissions !== null) {
      const requesterPerms = BigInt(requester.permissions ?? 0n);
      const currentPerms = BigInt(target.permissions ?? 0n);
      const desiredPerms = BigInt(dto.permissions ?? 0);

      const added   = desiredPerms & ~currentPerms;  // bits being granted
      const removed = currentPerms & ~desiredPerms;  // bits being revoked

      // Clamp to valid permission universe
      const validPerms = TEAM_MEMBER_PERMISSIONS_ALL;

      // Bits the requester does NOT hold but is trying to grant
      const illegalAdd = added & ~requesterPerms & validPerms;
      if (illegalAdd !== 0n) {
        throw new TeamMemberIllegalPermissionGrantError(illegalAdd);
      }

      // Bits the requester does NOT hold but is trying to revoke
      const illegalRemove = removed & ~requesterPerms & validPerms;
      if (illegalRemove !== 0n) {
        throw new TeamMemberIllegalPermissionRevokeError(illegalRemove);
      }
    }

    // ── 5. Apply update ───────────────────────────────────────────────────────
    const updated = await this.repo.updateTeamMember(team.id, targetMemberId, {
      role: dto.role !== undefined ? (dto.role as TeamMemberRole | null) : undefined,
      title: dto.title !== undefined ? dto.title : undefined,
      isHidden: dto.isHidden !== undefined ? dto.isHidden : undefined,
      permissions: dto.permissions !== undefined && dto.permissions !== null
        ? BigInt(dto.permissions)
        : undefined,
    });

    if (!updated) throw new TeamMemberNotFoundError(team.id, targetMemberId);

    return this.toPresenter(updated);
  }

  private toPresenter(member: TeamMemberEntity ): TeamMemberPresenter {
    return plainToInstance(
      TeamMemberPresenter,
      {
        ...member,
        id: member.id,
        teamId: member.teamId,
        profileId: member.profileId,

        role: member.role ?? null,
        title: member.title ?? null,
        isHidden: member.isHidden,
        permissions: Number(member.permissions ?? 0),
        status: member.deletedAt == null ? 'current':'old'
      },
      { excludeExtraneousValues: true },
    );
  }
}
