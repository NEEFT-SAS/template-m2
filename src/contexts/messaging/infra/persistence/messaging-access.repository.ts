import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import {
  MessagingAccessRepositoryPort,
  MessagingPlayerSnapshot,
  MessagingTeamSnapshot,
} from '../../app/ports/messaging-access.repository.port';
import { MessagingEntityType } from '../../domain/types/messaging.types';

@Injectable()
export class MessagingAccessRepositoryTypeorm implements MessagingAccessRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly profileRepo: Repository<UserProfileEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepo: Repository<TeamMemberEntity>,
  ) {}

  async findPlayerById(profileId: string): Promise<MessagingPlayerSnapshot | null> {
    if (!profileId) return null;

    const profile = await this.profileRepo.findOne({
      where: { id: profileId },
      select: ['id', 'slug', 'username', 'profilePicture'],
    });

    if (!profile) return null;
    return this.toPlayerSnapshot(profile);
  }

  async findPlayerBySlug(slug: string): Promise<MessagingPlayerSnapshot | null> {
    if (!slug) return null;

    const profile = await this.profileRepo.findOne({
      where: { slug },
      select: ['id', 'slug', 'username', 'profilePicture'],
    });

    if (!profile) return null;
    return this.toPlayerSnapshot(profile);
  }

  async findPlayersByIds(profileIds: string[]): Promise<MessagingPlayerSnapshot[]> {
    if (!profileIds.length) return [];

    const rows = await this.profileRepo.find({
      where: { id: In(profileIds) },
      select: ['id', 'slug', 'username', 'profilePicture'],
    });

    return rows.map((row) => this.toPlayerSnapshot(row));
  }

  async findTeamById(teamId: string): Promise<MessagingTeamSnapshot | null> {
    if (!teamId) return null;

    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: ['id', 'slug', 'name', 'logoPicture'],
    });

    if (!team) return null;
    return this.toTeamSnapshot(team);
  }

  async findTeamBySlug(slug: string): Promise<MessagingTeamSnapshot | null> {
    if (!slug) return null;

    const team = await this.teamRepo.findOne({
      where: { slug },
      select: ['id', 'slug', 'name', 'logoPicture'],
    });

    if (!team) return null;
    return this.toTeamSnapshot(team);
  }

  async findTeamsByIds(teamIds: string[]): Promise<MessagingTeamSnapshot[]> {
    if (!teamIds.length) return [];

    const rows = await this.teamRepo.find({
      where: { id: In(teamIds) },
      select: ['id', 'slug', 'name', 'logoPicture'],
    });

    return rows.map((row) => this.toTeamSnapshot(row));
  }

  async canAccessTeam(teamId: string, profileId: string): Promise<boolean> {
    if (!teamId || !profileId) return false;

    const isOwner = await this.teamRepo.exists({
      where: { id: teamId, owner: { id: profileId } },
    });
    if (isOwner) return true;

    return this.teamMemberRepo.exists({
      where: { team: { id: teamId }, profile: { id: profileId } },
    });
  }

  async listAccessibleTeams(profileId: string): Promise<MessagingTeamSnapshot[]> {
    if (!profileId) return [];

    const ownerTeams = await this.teamRepo.find({
      where: { owner: { id: profileId } },
      select: ['id', 'slug', 'name', 'logoPicture'],
    });

    const memberTeams = await this.teamMemberRepo
      .createQueryBuilder('member')
      .innerJoin('member.team', 'team')
      .select('team.id', 'id')
      .addSelect('team.slug', 'slug')
      .addSelect('team.name', 'name')
      .addSelect('team.logo_picture', 'logoPicture')
      .where('member.profile_id = :profileId', { profileId })
      .getRawMany<{ id: string; slug: string; name: string; logoPicture: string | null }>();

    const map = new Map<string, MessagingTeamSnapshot>();
    ownerTeams.forEach((team) => map.set(team.id, this.toTeamSnapshot(team)));
    memberTeams.forEach((team) => {
      map.set(team.id, {
        id: team.id,
        slug: team.slug,
        name: team.name,
        logoPicture: team.logoPicture ?? null,
      });
    });

    return Array.from(map.values());
  }

  async listTeamMemberProfileIds(teamId: string): Promise<string[]> {
    if (!teamId) return [];

    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      select: ['id'],
      relations: { owner: true },
    });

    if (!team?.owner?.id) return [];

    const memberRows = await this.teamMemberRepo
      .createQueryBuilder('member')
      .select('member.profile_id', 'profileId')
      .where('member.team_id = :teamId', { teamId })
      .getRawMany<{ profileId: string }>();

    const ids = new Set<string>([team.owner.id]);
    memberRows.forEach((row) => {
      if (row.profileId) ids.add(row.profileId);
    });

    return Array.from(ids);
  }

  async listEntityProfileIds(entityType: MessagingEntityType, entityId: string): Promise<string[]> {
    if (!entityId) return [];
    if (entityType === 'PLAYER') return [entityId];
    return this.listTeamMemberProfileIds(entityId);
  }

  private toPlayerSnapshot(profile: UserProfileEntity): MessagingPlayerSnapshot {
    return {
      id: profile.id,
      slug: profile.slug,
      username: profile.username,
      profilePicture: profile.profilePicture ?? null,
    };
  }

  private toTeamSnapshot(team: TeamEntity): MessagingTeamSnapshot {
    return {
      id: team.id,
      slug: team.slug,
      name: team.name,
      logoPicture: team.logoPicture ?? null,
    };
  }
}
