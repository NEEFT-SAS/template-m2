import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { RscLanguageEntity } from '@/contexts/resources/infra/persistence/entities/rsc-languages.entity';
import { TeamEntity } from '../../entities/team.entity';
import { TeamMemberEntity } from '../../entities/team-member.entity';
import { TeamRosterEntity } from '../../entities/team-roster.entity';
import { TeamRosterMemberEntity } from '../../entities/team-roster-member.entity';
import { CreateTeamInput, CreateTeamMemberInput, CreateTeamRosterInput, CreateTeamRosterMemberInput, TeamRepositoryPort, UpdateTeamInput, UpdateTeamMemberInput } from '../../../app/ports/team.repository.port';
import { toLowerCaseTrim } from '@neeft-sas/shared';

@Injectable()
export class TeamRepositoryTypeorm implements TeamRepositoryPort {
  constructor(
    @InjectRepository(TeamEntity) private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
    @InjectRepository(TeamMemberEntity) private readonly memberRepo: Repository<TeamMemberEntity>,
    @InjectRepository(TeamRosterEntity) private readonly rosterRepo: Repository<TeamRosterEntity>,
    @InjectRepository(TeamRosterMemberEntity) private readonly rosterMemberRepo: Repository<TeamRosterMemberEntity>,
  ) {}

  async existsSlug(slug: string): Promise<boolean> {
    const row = await this.teamRepo.exists({ where: { slug } });
    return !!row;
  }

  async existsOwnerProfile(ownerProfileId: string): Promise<boolean> {
    const row = await this.profileRepo.exists({ where: { id: ownerProfileId } });
    return !!row;
  }

  async findTeamById(teamId: string): Promise<TeamEntity | null> {
    const entity = await this.teamRepo.findOne({ where: { id: teamId } });
    return entity ?? null;
  }

  async findTeamBySlug(slug: string): Promise<TeamEntity | null> {
    const normalized = toLowerCaseTrim(slug);
    if (!normalized) return null;

    const entity = await this.teamRepo
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.country', 'country')
      .leftJoinAndSelect('team.languages', 'language')
      .leftJoinAndSelect('team.owner', 'owner')
      .where('LOWER(team.slug) = LOWER(:slug)', { slug: normalized })
      .getOne();

    return entity ?? null;
  }

  async findProfileBySlug(slug: string): Promise<UserProfileEntity | null> {
    const normalized = toLowerCaseTrim(slug);
    if (!normalized) return null;

    const entity = await this.profileRepo
      .createQueryBuilder('profile')
      .where('LOWER(profile.slug) = LOWER(:slug)', { slug: normalized })
      .getOne();

    return entity ?? null;
  }

  async findTeamMemberByProfile(teamId: string, profileId: string): Promise<TeamMemberEntity | null> {
    const entity = await this.memberRepo.findOne({
      where: { team: { id: teamId }, profile: { id: profileId } },
      withDeleted: true,
      relations: ["profile"]
    });
    return entity ?? null;
  }

  async findTeamMemberById(teamId: string, memberId: string): Promise<TeamMemberEntity | null> {
    const entity = await this.memberRepo.findOne({
      where: { id: memberId, team: { id: teamId } },
    });
    return entity ?? null;
  }

  async findRosterById(teamId: string, rosterId: string): Promise<TeamRosterEntity | null> {
    const entity = await this.rosterRepo.findOne({
      where: { id: rosterId, team: { id: teamId } },
    });
    return entity ?? null;
  }

  async findRosterMemberByRosterAndMember(rosterId: string, memberId: string): Promise<TeamRosterMemberEntity | null> {
    const entity = await this.rosterMemberRepo.findOne({
      where: { roster: { id: rosterId }, member: { id: memberId } },
    });
    return entity ?? null;
  }

  async existsRosterSlug(teamId: string, slug: string): Promise<boolean> {
    const row = await this.rosterRepo.exists({ where: { team: { id: teamId }, slug } });
    return !!row;
  }

  async createTeam(input: CreateTeamInput): Promise<TeamEntity> {
    const entity = this.teamRepo.create({
      name: input.name,
      acronym: input.acronym,
      slug: input.slug,
      description: input.description ?? null,
      quote: input.quote ?? null,
      bannerPicture: input.bannerPicture ?? null,
      logoPicture: input.logoPicture ?? null,
      foundedAt: input.foundedAt ?? null,
      city: input.city ?? null,
      country: input.countryId ? ({ id: input.countryId } as TeamEntity['country']) : null,
      owner: { id: input.ownerProfileId } as UserProfileEntity,
      languages: input.languageIds.map((id) => ({ id } as RscLanguageEntity)),
    });

    const saved = await this.teamRepo.save(entity);
    const reloaded = await this.teamRepo.findOne({ where: { id: saved.id } });
    return reloaded ?? saved;
  }

  async createTeamMember(teamId: string, input: CreateTeamMemberInput): Promise<TeamMemberEntity> {
    const entity = this.memberRepo.create({
      team: { id: teamId } as TeamEntity,
      profile: { id: input.profileId } as UserProfileEntity,
      role: input.role ?? null,
      title: input.title ?? null,
      isHidden: input.isHidden ?? false,
      permissions: input.permissions ?? 0n,
    });

    const saved = await this.memberRepo.save(entity);
    const reloaded = await this.memberRepo.findOne({ where: { id: saved.id } });
    return reloaded ?? saved;
  }

  async createRoster(teamId: string, input: CreateTeamRosterInput): Promise<TeamRosterEntity> {
    const entity = this.rosterRepo.create({
      team: { id: teamId } as TeamEntity,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      game: { id: input.gameId } as TeamRosterEntity['game'],
      isActive: input.isActive,
    });

    const saved = await this.rosterRepo.save(entity);
    const reloaded = await this.rosterRepo.findOne({ where: { id: saved.id } });
    return reloaded ?? saved;
  }

  async createRosterMember(rosterId: string, input: CreateTeamRosterMemberInput): Promise<TeamRosterMemberEntity> {
    const entity = this.rosterMemberRepo.create({
      roster: { id: rosterId } as TeamRosterEntity,
      member: { id: input.memberId } as TeamMemberEntity,
      role: input.role ?? 'MEMBER',
      title: input.title ?? null,
      position: input.positionId ? ({ id: input.positionId } as TeamRosterMemberEntity['position']) : null,
      isHidden: input.isHidden ?? false,
      permissions: input.permissions ?? 0,
    });

    const saved = await this.rosterMemberRepo.save(entity);
    const reloaded = await this.rosterMemberRepo.findOne({ where: { id: saved.id } });
    return reloaded ?? saved;
  }

  async updateTeam(teamId: string, input: UpdateTeamInput): Promise<TeamEntity | null> {
    const updates: Partial<TeamEntity> = { id: teamId };

    if (input.acronym !== undefined) updates.acronym = input.acronym;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.quote !== undefined) updates.quote = input.quote ?? null;
    if (input.bannerPicture !== undefined) updates.bannerPicture = input.bannerPicture ?? null;
    if (input.logoPicture !== undefined) updates.logoPicture = input.logoPicture ?? null;
    if (input.foundedAt !== undefined) updates.foundedAt = input.foundedAt ?? null;
    if (input.city !== undefined) updates.city = input.city ?? null;

    if (input.countryId !== undefined) {
      updates.country = input.countryId ? ({ id: input.countryId } as TeamEntity['country']) : null;
    }

    if (input.languageIds !== undefined) {
      const ids = input.languageIds ?? [];
      updates.languages = ids.map((id) => ({ id } as RscLanguageEntity));
    }

    const hasUpdates = Object.keys(updates).length > 1;
    if (hasUpdates) {
      await this.teamRepo.save(updates);
    }

    return this.findTeamById(teamId);
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.teamRepo.delete({ id: teamId });
  }

  async findTeamsByProfile(profileId: string): Promise<TeamEntity[]> {
    const entities = await this.teamRepo.find({
      where: { members: { profile: { id: profileId } } },
      relations: ['members', 'members.profile', 'country', 'languages', 'owner'],
    });
    return entities;
  }

  async findTeamMemberWithProfile(teamId: string, memberId: string): Promise<TeamMemberEntity | null> {
    const entity = await this.memberRepo
      .createQueryBuilder('member')
      .withDeleted()
      .leftJoinAndSelect('member.profile', 'profile')
      .where('member.id = :memberId', { memberId })
      .andWhere('member.team_id = :teamId', { teamId })
      .getOne();
    return entity ?? null;
  }

  async findTeamMembersWithProfile(teamId: string): Promise<TeamMemberEntity[]> {
    const entity = await this.memberRepo.find({
      where: {team: {id: teamId}},
      withDeleted: true,
      relations: ['profile', 'team', 'team.owner']
    })
    return entity ?? null;
  }

  async findTeamOwnerMember(teamId:string): Promise<TeamMemberEntity> {
    const owner = await this.memberRepo
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.team', 'team')
      .leftJoinAndSelect('team.owner', 'owner')
      .leftJoinAndSelect('member.profile', 'profile')
      .where('owner.id = profile.id')
      .getOne();
    return owner
  }

  async updateTeamMember(teamId: string, memberId: string, input: UpdateTeamMemberInput): Promise<TeamMemberEntity | null> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, team: { id: teamId } },
    });
    if (!member) return null;

    if (input.role !== undefined) member.role = input.role;
    if (input.title !== undefined) member.title = input.title ?? null;
    if (input.isHidden !== undefined) member.isHidden = input.isHidden;
    if (input.permissions !== undefined) member.permissions = input.permissions;

    await this.memberRepo.save(member);
    return this.findTeamMemberWithProfile(teamId, memberId);
  }

  async deleteTeamMember(teamId: string, memberId: string): Promise<void> {
    await this.memberRepo.update({id: memberId, team: { id: teamId }}, { status: 'former' });
    await this.memberRepo.softDelete({ id: memberId, team: { id: teamId } });
  }

  async saveTeamMemberEntity(member: TeamMemberEntity): Promise<TeamMemberEntity> {
    const saved = await this.memberRepo.save(member);
    const reloaded = await this.memberRepo.findOne({ where: { id: saved.id } });
    return reloaded ?? saved;
  }

  ensureTeamMemberIsValid(teamId: string, member: TeamMemberEntity): boolean {
    if(!member) return false;
    if(member.teamId !== teamId) return false;
    if(member.status !== 'current') return false;
    if(member.deletedAt !== null) return false;
    return true
  }
}
