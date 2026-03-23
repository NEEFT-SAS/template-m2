import { Inject, Injectable } from '@nestjs/common';
import { slugifyUnique } from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamInvalidCountryError,
  TeamInvalidLanguagesError,
  TeamOwnerNotFoundError,
} from '../../../domain/errors/team.errors';
import { CreateTeamDTO, TeamPresenter } from '@/typage';
import { TeamScoreService } from '../../services/team-score.service';
import { mapTeamResponse } from '../../services/team-response.mapper';
import { TEAM_MEMBER_PERMISSIONS_ALL } from '@/contexts/teams/domain/team-member.permissions';

@Injectable()
export class CreateTeamUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    private readonly teamScoreService: TeamScoreService,
  ) {}

  async execute(
    ownerProfileId: string,
    dto: CreateTeamDTO,
  ): Promise<TeamPresenter> {
    if (!ownerProfileId) {
      throw new TeamOwnerNotFoundError(ownerProfileId);
    }

    const ownerExists = await this.repo.existsOwnerProfile(ownerProfileId);
    if (!ownerExists) {
      throw new TeamOwnerNotFoundError(ownerProfileId);
    }

    const snapshot = this.resourcesStore.getSnapshot();

    if (dto.countryId !== undefined && dto.countryId !== null) {
      const allowedCountries = new Set(
        snapshot.rscCountries.map((country) => country.id),
      );
      if (!allowedCountries.has(dto.countryId)) {
        throw new TeamInvalidCountryError(dto.countryId);
      }
    }

    const languageIds = Array.from(new Set(dto.languageIds ?? []));
    const allowedLanguages = new Set(
      snapshot.rscLanguages.map((language) => language.id),
    );
    const invalidLanguageIds = languageIds.filter(
      (id) => !allowedLanguages.has(id),
    );
    if (invalidLanguageIds.length) {
      throw new TeamInvalidLanguagesError(invalidLanguageIds);
    }

    const isFoundedAtPresent = dto.foundedAt !== undefined && dto.foundedAt !== null;
    if (isFoundedAtPresent) {
      const foundedAtDate = new Date(dto.foundedAt);
      if (isNaN(foundedAtDate.getTime())) {
        throw new Error('Invalid foundedAt date');
      }
      if(foundedAtDate > new Date()) {
        throw new Error('Founded date cannot be in the future');
      }
    }

    const slug = await slugifyUnique(
      dto.name,
      async (candidate) => await this.repo.existsSlug(candidate),
      { allowBaseSlug: false, suffixDigits: 4, maxRetries: 12 },
    );

    const created = await this.repo.createTeam({
      ownerProfileId,
      slug,
      name: dto.name,
      acronym: dto.acronym,
      description: dto.description ?? null,
      quote: dto.quote ?? null,
      bannerPicture: dto.bannerPicture ?? null,
      logoPicture: dto.logoPicture ?? null,
      foundedAt: dto.foundedAt ?? null,
      city: dto.city ?? null,
      countryId: dto.countryId ?? null,
      languageIds,
    });
    await this.repo.createTeamMember(created.id, {
      profileId: ownerProfileId,
      role: 'OWNER',
      isHidden: false,
      title: "Team owner",
      permissions: TEAM_MEMBER_PERMISSIONS_ALL
    });
    await this.teamScoreService.recomputeTeamScores(created.id);
    const withScores = await this.repo.findTeamById(created.id);

    return mapTeamResponse(withScores ?? created, this.teamScoreService);
  }
}
