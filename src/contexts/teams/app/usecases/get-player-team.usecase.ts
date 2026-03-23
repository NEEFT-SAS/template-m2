import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '../ports/team.repository.port';
import { TeamPrivateProfilePresenter, TeamPresenter } from '@/typage';
import { RscCountryPresenter, RscLanguagePresenter, UserTeamPresenter } from "@neeft-sas/shared"

@Injectable()
export class GetPlayerTeamsUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
  ) {}

  async execute(requesterId: string): Promise<UserTeamPresenter[]> {
    const team = await this.repo.findTeamsByProfile(requesterId);

    const res = team.map<UserTeamPresenter>((t) => {
      return {
        membershipId: t.members[0].id,
        teamId: t.id,
        slug: t.slug,
        name: t.name,
        acronym: t.acronym,
        logoUrl: t.logoPicture,
        bannerUrl: t.bannerPicture,
        role: t.members[0].role,
        title: t.members[0].title,
        isOwner: t.owner.id === requesterId,
        permissions: Number(t.members[0].permissions),
        country: plainToInstance(RscCountryPresenter, t.country),
        languages: t.languages.map((l) => plainToInstance(RscLanguagePresenter, l)),
      }
    });
    return res;
  }
}

