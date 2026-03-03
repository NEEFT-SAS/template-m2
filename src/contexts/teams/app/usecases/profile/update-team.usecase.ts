import { Inject, Injectable } from '@nestjs/common';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { TEAM_REPOSITORY, TeamRepositoryPort, UpdateTeamInput } from '../../ports/team.repository.port';
import { TeamInvalidCountryError, TeamInvalidLanguagesError, TeamNotFoundError } from '../../../domain/errors/team.errors';
import { plainToInstance } from 'class-transformer';
import { TeamPresenter, UpdateTeamDTO } from '@/typage';

@Injectable()
export class UpdateTeamUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(teamId: string, dto: UpdateTeamDTO): Promise<TeamPresenter> {
    const existing = await this.repo.findTeamById(teamId);
    if (!existing) {
      throw new TeamNotFoundError(teamId);
    }

    const updates: UpdateTeamInput = {};

    if (dto.acronym !== undefined) updates.acronym = dto.acronym;
    if (dto.description !== undefined) updates.description = dto.description ?? null;
    if (dto.quote !== undefined) updates.quote = dto.quote ?? null;
    if (dto.bannerPicture !== undefined) updates.bannerPicture = dto.bannerPicture ?? null;
    if (dto.logoPicture !== undefined) updates.logoPicture = dto.logoPicture ?? null;
    if (dto.foundedAt !== undefined) updates.foundedAt = dto.foundedAt ?? null;
    if (dto.city !== undefined) updates.city = dto.city ?? null;

    const snapshot = this.resourcesStore.getSnapshot();

    if (dto.countryId !== undefined) {
      if (dto.countryId !== null) {
        const allowedCountries = new Set(snapshot.rscCountries.map((country) => country.id));
        if (!allowedCountries.has(dto.countryId)) {
          throw new TeamInvalidCountryError(dto.countryId);
        }
      }
      updates.countryId = dto.countryId ?? null;
    }

    if (dto.languageIds !== undefined) {
      const uniqueLanguageIds = Array.from(new Set(dto.languageIds));
      const allowedLanguages = new Set(snapshot.rscLanguages.map((language) => language.id));
      const invalidLanguageIds = uniqueLanguageIds.filter((id) => !allowedLanguages.has(id));
      if (invalidLanguageIds.length) {
        throw new TeamInvalidLanguagesError(invalidLanguageIds);
      }
      updates.languageIds = uniqueLanguageIds;
    }

    if (!Object.keys(updates).length) {
      return plainToInstance(TeamPresenter, existing, { excludeExtraneousValues: true });
    }

    const updated = await this.repo.updateTeam(teamId, updates);
    if (!updated) {
      throw new TeamNotFoundError(teamId);
    }

    return plainToInstance(TeamPresenter, updated, { excludeExtraneousValues: true });
  }
}
