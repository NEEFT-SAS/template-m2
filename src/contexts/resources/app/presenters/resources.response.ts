import { Expose, Type } from 'class-transformer';

export class RscSocialPlatformResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  key!: string;

  @Expose()
  label!: string;

  @Expose()
  type!: string;

  @Expose()
  baseUrl!: string | null;

  @Expose()
  placeholder!: string | null;

  @Expose()
  example!: string | null;

  @Expose()
  icon!: string | null;
}

export class RscProfileBadgeResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  key!: string;

  @Expose()
  label!: string;

  @Expose()
  description!: string | null;

  @Expose()
  icon!: string | null;

  @Expose()
  priority!: number;

  @Expose()
  scope!: string;
}

export class RscCountryResponsePresenter {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  code3!: string;

  @Expose()
  name!: string;

  @Expose()
  i18nName!: string;

  @Expose()
  flagIcon!: string | null;
}

export class RscLanguageResponsePresenter {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  locale!: string | null;

  @Expose()
  label!: string;

  @Expose()
  i18nLabel!: string;

  @Expose()
  direction!: string;

  @Expose()
  flagIcon!: string | null;
}

export class RscGameCharacterResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  icon!: string | null;
}

export class RscGameModeResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  description!: string | null;

  @Expose()
  isRanked!: boolean;

  @Expose()
  order!: number;
}

export class RscGamePlatformResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  icon!: string | null;
}

export class RscGamePositionResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  icon!: string | null;

  @Expose()
  order!: number;
}

export class RscGameRankResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  order!: number;

  @Expose()
  division!: string;

  @Expose()
  tier!: string | null;

  @Expose()
  icon!: string | null;
}

export class RscGameSeasonResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  code!: string;

  @Expose()
  name!: string;

  @Expose()
  @Type(() => Date)
  startDate!: Date | null;

  @Expose()
  @Type(() => Date)
  endDate!: Date | null;
}

export class RscGameResponsePresenter {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  shortName!: string | null;

  @Expose()
  slug!: string;

  @Expose()
  genre!: string | null;

  @Expose()
  developer!: string | null;

  @Expose()
  @Type(() => Date)
  releaseDate!: Date | null;

  @Expose()
  edition!: string | null;

  @Expose()
  officialLink!: string | null;

  @Expose()
  apiLink!: string | null;

  @Expose()
  icon!: string | null;

  @Expose()
  banner!: string | null;

  @Expose()
  description!: string | null;

  @Expose()
  @Type(() => RscGamePlatformResponsePresenter)
  rscGamePlatforms!: RscGamePlatformResponsePresenter[];

  @Expose()
  @Type(() => RscGameModeResponsePresenter)
  rscGameModes!: RscGameModeResponsePresenter[];

  @Expose()
  @Type(() => RscGamePositionResponsePresenter)
  rscGamePositions!: RscGamePositionResponsePresenter[];

  @Expose()
  @Type(() => RscGameRankResponsePresenter)
  rscGameRanks!: RscGameRankResponsePresenter[];

  @Expose()
  @Type(() => RscGameSeasonResponsePresenter)
  rscGameSeasons!: RscGameSeasonResponsePresenter[];

  @Expose()
  @Type(() => RscGameCharacterResponsePresenter)
  rscGameCharacters!: RscGameCharacterResponsePresenter[];
}

export class RscStaffRoleOptionResponsePresenter {
  @Expose()
  id!: string;

  @Expose()
  label!: string;

  @Expose()
  slug!: string | null;

  @Expose()
  icon!: string | null;
}

export class RscStaffRoleResponsePresenter {
  @Expose()
  id!: string;

  @Expose()
  slug!: string;

  @Expose()
  label!: string;

  @Expose()
  icon!: string | null;

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscLanguagesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscGamesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscReferenceTypesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscToolsOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscProgrammingLanguagesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscFrameworksOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscCodingScopesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscDesignScopesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscSoftwareOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscEditingFormatsOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscStreamingPlatformsOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscCastingStylesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscManagementScopesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscCoachingScopesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscMentalCoachingScopesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscPhysicalCoachingScopesOptions?: RscStaffRoleOptionResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleOptionResponsePresenter)
  rscLeadershipScopesOptions?: RscStaffRoleOptionResponsePresenter[];
}

export class ResourcesResponsePresenter {
  @Expose()
  version!: string;

  @Expose()
  @Type(() => RscSocialPlatformResponsePresenter)
  rscSocialPlatforms!: RscSocialPlatformResponsePresenter[];

  @Expose()
  @Type(() => RscProfileBadgeResponsePresenter)
  rscProfileBadges!: RscProfileBadgeResponsePresenter[];

  @Expose()
  @Type(() => RscCountryResponsePresenter)
  rscCountries!: RscCountryResponsePresenter[];

  @Expose()
  @Type(() => RscLanguageResponsePresenter)
  rscLanguages!: RscLanguageResponsePresenter[];

  @Expose()
  @Type(() => RscGameResponsePresenter)
  rscGames!: RscGameResponsePresenter[];

  @Expose()
  @Type(() => RscStaffRoleResponsePresenter)
  rscStaffRoles!: RscStaffRoleResponsePresenter[];
}
