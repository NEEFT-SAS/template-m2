import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toLowerCaseTrim } from '@neeft-sas/shared';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import {
  FollowPlayerSnapshot,
  FollowSubjectsRepositoryPort,
  FollowTeamSnapshot,
} from '../../app/ports/follow-subjects.repository.port';

@Injectable()
export class FollowSubjectsRepositoryTypeorm implements FollowSubjectsRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profileRepo: Repository<UserProfileEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepo: Repository<TeamMemberEntity>,
  ) {}

  async findPlayerBySlug(slug: string): Promise<FollowPlayerSnapshot | null> {
    const normalized = toLowerCaseTrim(slug);
    if (!normalized) return null;

    const player = await this.profileRepo
      .createQueryBuilder('profile')
      .where('LOWER(profile.slug) = LOWER(:slug)', { slug: normalized })
      .getOne();

    if (!player) return null;

    return {
      id: player.id,
      slug: player.slug,
      profilePicture: player.profilePicture ?? null,
    };
  }

  async findTeamBySlug(slug: string): Promise<FollowTeamSnapshot | null> {
    const normalized = toLowerCaseTrim(slug);
    if (!normalized) return null;

    const team = await this.teamRepo
      .createQueryBuilder('team')
      .where('LOWER(team.slug) = LOWER(:slug)', { slug: normalized })
      .getOne();

    if (!team) return null;

    return {
      id: team.id,
      slug: team.slug,
      logoPicture: team.logoPicture ?? null,
    };
  }

  async findPlayerSlugById(profileId: string): Promise<string | null> {
    if (!profileId) return null;

    const row = await this.profileRepo.findOne({
      where: { id: profileId },
      select: ['slug'],
    });

    return row?.slug ?? null;
  }

  async canManageTeamFollow(teamId: string, profileId: string): Promise<boolean> {
    if (!teamId || !profileId) return false;

    const isOwner = await this.teamRepo.exists({
      where: { id: teamId, owner: { id: profileId } },
    });
    if (isOwner) return true;

    const member = await this.teamMemberRepo.findOne({
      where: { team: { id: teamId }, profile: { id: profileId } },
      select: ['permissions'],
    });

    return !!member && (member.permissions & TEAM_MEMBER_PERMISSIONS.MANAGE_FOLLOW) === TEAM_MEMBER_PERMISSIONS.MANAGE_FOLLOW;
  }

  async listTeamsWithFollowPermission(profileId: string): Promise<Array<{ id: string; slug: string }>> {
    if (!profileId) return [];

    const ownerTeams = await this.teamRepo.find({
      where: { owner: { id: profileId } },
    });

    const memberTeams = await this.teamMemberRepo.find({
      where: { profile: { id: profileId } },
      relations: { team: true },
    });

    const permittedMembers = memberTeams
      .filter(
        (member) =>
          (BigInt(member.permissions) & TEAM_MEMBER_PERMISSIONS.MANAGE_FOLLOW) ===
          TEAM_MEMBER_PERMISSIONS.MANAGE_FOLLOW,
      )
      .map((member) => ({
        id: member.team?.id ?? member.teamId,
        slug: member.team?.slug ?? '',
      }))
      .filter((item) => Boolean(item.id) && Boolean(item.slug));

    const map = new Map<string, string>();
    for (const team of ownerTeams) {
      map.set(team.id, team.slug);
    }
    for (const team of permittedMembers) {
      map.set(team.id, team.slug);
    }
    return Array.from(map.entries()).map(([id, slug]) => ({ id, slug }));
  }
}
