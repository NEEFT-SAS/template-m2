import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { RscLanguageEntity } from '@/contexts/resources/infra/persistence/entities/rsc-languages.entity';
import { TeamEntity } from '../../entities/team.entity';
import { CreateTeamInput, TeamRepositoryPort, UpdateTeamInput } from '../../../app/ports/team.repository.port';

@Injectable()
export class TeamRepositoryTypeorm implements TeamRepositoryPort {
  constructor(
    @InjectRepository(TeamEntity) private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
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

  async createTeam(input: CreateTeamInput): Promise<TeamEntity> {
    const entity = this.teamRepo.create({
      name: input.name,
      acronym: input.acronym,
      slug: input.slug,
      organizationType: input.organizationType,
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

  async updateTeam(teamId: string, input: UpdateTeamInput): Promise<TeamEntity | null> {
    const updates: Partial<TeamEntity> = { id: teamId };

    if (input.acronym !== undefined) updates.acronym = input.acronym;
    if (input.organizationType !== undefined) updates.organizationType = input.organizationType;
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
}
