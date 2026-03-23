import { TeamPrivateProfilePresenter, TeamPresenter } from '@/typage';
import { TeamEntity } from '../../infra/entities/team.entity';
import { TeamScoreService } from './team-score.service';

type TeamResponse = TeamPresenter & { profileScore: number };
type TeamPrivateResponse = TeamPrivateProfilePresenter & {
  profileScore: number;
};

export function mapTeamResponse(
  team: TeamEntity,
  teamScoreService: TeamScoreService,
): TeamResponse {
  const completenessScore = Number(team.completenessScore ?? 0);
  const trustScore = Number(team.trustScore ?? 0);
  const profileScore = teamScoreService.computeProfileScore(
    completenessScore,
    trustScore,
  );
  const country = team.country
    ? {
        id: team.country.id,
        code: team.country.code,
        code3: team.country.code3,
        name: team.country.name,
        i18nName: team.country.i18nName,
        flagIcon: team.country.flagIcon ?? null,
      }
    : null;
  const languages = Array.isArray(team.languages)
    ? team.languages.map((language) => ({
        id: language.id,
        code: language.code,
        locale: language.locale ?? '',
        label: language.label,
        i18nLabel: language.i18nName,
        direction: language.direction,
        flagIcon: language.flagIcon ?? null,
      }))
    : [];

  return {
    id: team.id,
    name: team.name,
    acronym: team.acronym,
    slug: team.slug,
    organizationType: team.organizationType,
    description: team.description ?? null,
    quote: team.quote ?? null,
    bannerPicture: team.bannerPicture ?? null,
    logoPicture: team.logoPicture ?? null,
    foundedAt: team.foundedAt ?? null,
    city: team.city ?? null,
    affiliated: Boolean(team.affiliated),
    isVerified: Boolean(team.isVerified),
    completenessScore,
    trustScore,
    profileScore,
    country,
    languages,
    owner: {
      id: team.owner?.id ?? '',
      username: team.owner?.username ?? '',
      slug: team.owner?.slug ?? '',
      profilePicture: team.owner?.profilePicture ?? null,
    },
  } as TeamResponse;
}

export function mapTeamPrivateResponse(
  team: TeamEntity,
  permissions: bigint | null,
  teamScoreService: TeamScoreService,
): TeamPrivateResponse {
  return {
    ...mapTeamResponse(team, teamScoreService),
    permissions,
  } as TeamPrivateResponse;
}
