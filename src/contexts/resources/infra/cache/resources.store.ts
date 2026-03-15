import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import type { ResourcesPresenter as SharedResourcesPresenter } from '@neeft-sas/shared';
import { Repository } from 'typeorm';
import {
  ResourcesResponsePresenter,
  RscStaffRoleOptionResponsePresenter,
  RscStaffRoleResponsePresenter,
} from '../../app/presenters/resources.response';
import { RscCountryEntity } from '../persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from '../persistence/entities/rsc-languages.entity';
import { RscProfileBadgeEntity } from '../persistence/entities/rsc-profile-badges.entity';
import { RscSocialPlatformEntity } from '../persistence/entities/rsc-socials-platforms.entity';
import { RscGameEntity } from '../persistence/entities/games/rsc-games.entity';
import { RscGameCharacterEntity } from '../persistence/entities/games/relations/rsc-game-characters.entity';
import { RscGameModeEntity } from '../persistence/entities/games/relations/rsc-game-modes.entity';
import { RscGamePlatformEntity } from '../persistence/entities/games/relations/rsc-game-platforms.entity';
import { RscGamePositionEntity } from '../persistence/entities/games/relations/rsc-game-positions.entity';
import { RscGameRankEntity } from '../persistence/entities/games/relations/rsc-game-ranks.entity';
import { RscGameSeasonEntity } from '../persistence/entities/games/relations/rsc-game-seasons.entity';
import {
  RscStaffOptionGroupEntity,
  RscStaffOptionGroupSourceType,
} from '../persistence/entities/staff/rsc-staff-option-group.entity';
import { RscStaffGroupOptionEntity } from '../persistence/entities/staff/rsc-staff-group-option.entity';
import { RscStaffOptionEntity } from '../persistence/entities/staff/rsc-staff-option.entity';
import { RscStaffRoleOptionLinkEntity } from '../persistence/entities/staff/rsc-staff-role-option-link.entity';
import { RscStaffRoleEntity } from '../persistence/entities/staff/rsc-staff-role.entity';

type ResourcesSnapshot = SharedResourcesPresenter & {
  rscStaffRoles: RscStaffRoleResponsePresenter[];
};

type StaffRoleGroupKey =
  | 'rscLanguagesOptions'
  | 'rscGamesOptions'
  | 'rscReferenceTypesOptions'
  | 'rscToolsOptions'
  | 'rscProgrammingLanguagesOptions'
  | 'rscFrameworksOptions'
  | 'rscCodingScopesOptions'
  | 'rscDesignScopesOptions'
  | 'rscSoftwareOptions'
  | 'rscEditingFormatsOptions'
  | 'rscStreamingPlatformsOptions'
  | 'rscCastingStylesOptions'
  | 'rscManagementScopesOptions'
  | 'rscCoachingScopesOptions'
  | 'rscMentalCoachingScopesOptions'
  | 'rscPhysicalCoachingScopesOptions'
  | 'rscLeadershipScopesOptions';

const STAFF_ROLE_GROUP_KEYS = new Set<StaffRoleGroupKey>([
  'rscLanguagesOptions',
  'rscGamesOptions',
  'rscReferenceTypesOptions',
  'rscToolsOptions',
  'rscProgrammingLanguagesOptions',
  'rscFrameworksOptions',
  'rscCodingScopesOptions',
  'rscDesignScopesOptions',
  'rscSoftwareOptions',
  'rscEditingFormatsOptions',
  'rscStreamingPlatformsOptions',
  'rscCastingStylesOptions',
  'rscManagementScopesOptions',
  'rscCoachingScopesOptions',
  'rscMentalCoachingScopesOptions',
  'rscPhysicalCoachingScopesOptions',
  'rscLeadershipScopesOptions',
]);

const isStaffRoleGroupKey = (key: string): key is StaffRoleGroupKey =>
  STAFF_ROLE_GROUP_KEYS.has(key as StaffRoleGroupKey);

@Injectable()
export class ResourcesStore implements OnModuleInit {
  private readonly logger = new Logger(ResourcesStore.name);

  private snapshot: ResourcesSnapshot = {
    version: new Date().toISOString(),
    rscCountries: [],
    rscLanguages: [],
    rscSocialPlatforms: [],
    rscProfileBadges: [],
    rscGames: [],
    rscStaffRoles: [],
  };

  constructor(
    @InjectRepository(RscSocialPlatformEntity)
    private readonly socialRepo: Repository<RscSocialPlatformEntity>,
    @InjectRepository(RscProfileBadgeEntity)
    private readonly badgeRepo: Repository<RscProfileBadgeEntity>,
    @InjectRepository(RscCountryEntity)
    private readonly countryRepo: Repository<RscCountryEntity>,
    @InjectRepository(RscLanguageEntity)
    private readonly languageRepo: Repository<RscLanguageEntity>,
    @InjectRepository(RscGameEntity)
    private readonly gameRepo: Repository<RscGameEntity>,
    @InjectRepository(RscGamePlatformEntity)
    private readonly gamePlatformRepo: Repository<RscGamePlatformEntity>,
    @InjectRepository(RscGameModeEntity)
    private readonly gameModeRepo: Repository<RscGameModeEntity>,
    @InjectRepository(RscGamePositionEntity)
    private readonly gamePositionRepo: Repository<RscGamePositionEntity>,
    @InjectRepository(RscGameRankEntity)
    private readonly gameRankRepo: Repository<RscGameRankEntity>,
    @InjectRepository(RscGameSeasonEntity)
    private readonly gameSeasonRepo: Repository<RscGameSeasonEntity>,
    @InjectRepository(RscGameCharacterEntity)
    private readonly gameCharacterRepo: Repository<RscGameCharacterEntity>,
    @InjectRepository(RscStaffRoleEntity)
    private readonly staffRoleRepo: Repository<RscStaffRoleEntity>,
    @InjectRepository(RscStaffOptionGroupEntity)
    private readonly staffOptionGroupRepo: Repository<RscStaffOptionGroupEntity>,
    @InjectRepository(RscStaffOptionEntity)
    private readonly staffOptionRepo: Repository<RscStaffOptionEntity>,
    @InjectRepository(RscStaffGroupOptionEntity)
    private readonly staffGroupOptionRepo: Repository<RscStaffGroupOptionEntity>,
    @InjectRepository(RscStaffRoleOptionLinkEntity)
    private readonly staffRoleOptionLinkRepo: Repository<RscStaffRoleOptionLinkEntity>,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  getSnapshot(): ResourcesSnapshot {
    return this.snapshot;
  }

  async reload(): Promise<void> {
    const socials = await this.socialRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });

    const badges = await this.badgeRepo.find({
      where: { isActive: true },
      order: { priority: 'ASC', label: 'ASC' },
    });

    const countries = await this.countryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const languages = await this.languageRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });

    const games = await this.gameRepo.find({
      order: { name: 'ASC' },
    });

    const gamePlatforms = await this.gamePlatformRepo.find({
      relations: { platform: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameModes = await this.gameModeRepo.find({
      relations: { mode: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gamePositions = await this.gamePositionRepo.find({
      relations: { position: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameRanks = await this.gameRankRepo.find({
      relations: { rank: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameSeasons = await this.gameSeasonRepo.find({
      relations: { season: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameCharacters = await this.gameCharacterRepo.find({
      relations: { character: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const groupByGameId = <T extends { gameId: number }>(rows: T[]) => {
      const map = new Map<number, T[]>();
      for (const row of rows) {
        const bucket = map.get(row.gameId);
        if (bucket) bucket.push(row);
        else map.set(row.gameId, [row]);
      }
      return map;
    };

    const gamePlatformsByGameId = groupByGameId(gamePlatforms);
    const gameModesByGameId = groupByGameId(gameModes);
    const gamePositionsByGameId = groupByGameId(gamePositions);
    const gameRanksByGameId = groupByGameId(gameRanks);
    const gameSeasonsByGameId = groupByGameId(gameSeasons);
    const gameCharactersByGameId = groupByGameId(gameCharacters);

    const gamesWithRelations = games.map((game) => ({
      ...game,
      rscGamePlatforms: (gamePlatformsByGameId.get(game.id) ?? []).flatMap(
        (row) =>
          row.platform
            ? [
                {
                  id: row.platform.id,
                  name: row.platform.name,
                  slug: row.platform.slug,
                  icon: row.platform.icon,
                },
              ]
            : [],
      ),
      rscGameModes: (gameModesByGameId.get(game.id) ?? []).flatMap((row) =>
        row.mode
          ? [
              {
                id: row.mode.id,
                name: row.mode.name,
                slug: row.mode.slug,
                description: row.mode.description,
                isRanked: row.mode.isRanked,
                order: row.order,
              },
            ]
          : [],
      ),
      rscGamePositions: (gamePositionsByGameId.get(game.id) ?? []).flatMap(
        (row) =>
          row.position
            ? [
                {
                  id: row.position.id,
                  name: row.position.name,
                  slug: row.position.slug,
                  icon: row.position.icon,
                  order: row.order,
                },
              ]
            : [],
      ),
      rscGameRanks: (gameRanksByGameId.get(game.id) ?? []).flatMap((row) =>
        row.rank
          ? [
              {
                id: row.rank.id,
                name: row.rank.name,
                slug: row.rank.slug,
                order: row.order,
                division: row.rank.division,
                tier: row.rank.tier,
                icon: row.rank.icon,
              },
            ]
          : [],
      ),
      rscGameSeasons: (gameSeasonsByGameId.get(game.id) ?? []).flatMap((row) =>
        row.season
          ? [
              {
                id: row.season.id,
                code: row.season.code,
                name: row.season.name,
                startDate: row.season.startDate,
                endDate: row.season.endDate,
              },
            ]
          : [],
      ),
      rscGameCharacters: (gameCharactersByGameId.get(game.id) ?? []).flatMap(
        (row) =>
          row.character
            ? [
                {
                  id: row.character.id,
                  name: row.character.name,
                  slug: row.character.slug,
                  icon: row.character.icon,
                },
              ]
            : [],
      ),
    }));

    const rscStaffRoles = await this.buildStaffRoleResources(languages, games);

    const transformed = plainToInstance(
      ResourcesResponsePresenter,
      {
        version: new Date().toISOString(),
        rscSocialPlatforms: socials.map((item) => ({
          id: item.id,
          key: item.key,
          label: item.label,
          type: item.type,
          baseUrl: item.baseUrl ?? null,
          placeholder: item.placeholder ?? null,
          example: item.example ?? null,
          icon: item.icon ?? null,
        })),
        rscProfileBadges: badges.map((item) => ({
          id: item.id,
          key: item.key,
          label: item.label,
          description: item.description ?? null,
          icon: item.icon ?? null,
          priority: item.priority,
          scope: item.scope,
        })),
        rscCountries: countries.map((item) => ({
          id: item.id,
          code: item.code,
          code3: item.code3,
          name: item.name,
          i18nName: item.i18nName,
          flagIcon: item.flagIcon ?? null,
        })),
        rscLanguages: languages.map((item) => ({
          id: item.id,
          code: item.code,
          locale: item.locale ?? item.code,
          label: item.label,
          i18nLabel: item.i18nName,
          direction: item.direction,
          flagIcon: item.flagIcon ?? null,
        })),
        rscGames: gamesWithRelations.map((item) => ({
          id: item.id,
          name: item.name,
          shortName: item.shortName ?? null,
          slug: item.slug,
          genre: item.genre ?? null,
          developer: item.developer ?? null,
          releaseDate: item.releaseDate ?? null,
          edition: item.edition ?? null,
          officialLink: item.officialLink ?? null,
          apiLink: item.apiLink ?? null,
          icon: item.icon ?? null,
          banner: item.banner ?? null,
          description: item.description ?? null,
          rscGamePlatforms: item.rscGamePlatforms,
          rscGameModes: item.rscGameModes,
          rscGamePositions: item.rscGamePositions,
          rscGameRanks: item.rscGameRanks,
          rscGameSeasons: item.rscGameSeasons,
          rscGameCharacters: item.rscGameCharacters,
        })),
        rscStaffRoles,
      },
      { excludeExtraneousValues: true },
    );

    this.snapshot = transformed as unknown as ResourcesSnapshot;

    this.logger.log(
      `Resources loaded: rscSocialPlatforms=${this.snapshot.rscSocialPlatforms.length}, rscStaffRoles=${this.snapshot.rscStaffRoles.length}`,
    );
  }

  private toOption(
    id: string,
    label: string,
    slug?: string | null,
    icon?: string | null,
  ): RscStaffRoleOptionResponsePresenter {
    return {
      id,
      label,
      slug: slug ?? null,
      icon: icon ?? null,
    };
  }

  private createStaffRole(
    input: Pick<RscStaffRoleResponsePresenter, 'id' | 'slug' | 'label'> &
      Pick<RscStaffRoleResponsePresenter, 'icon'>,
  ): RscStaffRoleResponsePresenter {
    return {
      id: input.id,
      slug: input.slug,
      label: input.label,
      icon: input.icon ?? null,
    };
  }

  private async buildStaffRoleResources(
    languages: RscLanguageEntity[],
    games: RscGameEntity[],
  ): Promise<RscStaffRoleResponsePresenter[]> {
    const roles = await this.staffRoleRepo.find({
      where: { isActive: true },
      order: { label: 'ASC', id: 'ASC' },
    });

    if (!roles.length) return [];

    const groups = await this.staffOptionGroupRepo.find({
      where: { isActive: true },
      order: { key: 'ASC', id: 'ASC' },
    });

    if (!groups.length) return [];

    const options = await this.staffOptionRepo.find({
      where: { isActive: true },
      order: { label: 'ASC', id: 'ASC' },
    });

    const groupOptions = await this.staffGroupOptionRepo.find({
      order: { groupId: 'ASC', id: 'ASC' },
    });

    const links = await this.staffRoleOptionLinkRepo.find({
      order: { roleId: 'ASC', groupId: 'ASC', id: 'ASC' },
    });

    const roleIds = new Set(roles.map((role) => role.id));
    const groupIds = new Set(groups.map((group) => group.id));
    const filteredLinks = links.filter(
      (link) => roleIds.has(link.roleId) && groupIds.has(link.groupId),
    );

    const languageOptions = languages.map((item) =>
      this.toOption(item.id, item.label, item.code, item.flagIcon ?? null),
    );
    const gameOptions = games.map((item) =>
      this.toOption(String(item.id), item.name, item.slug, item.icon ?? null),
    );

    const groupsById = new Map(groups.map((group) => [group.id, group]));

    const staticOptionsByGroupId = new Map<
      number,
      RscStaffRoleOptionResponsePresenter[]
    >();
    const staticOptionsByOptionId = new Map<
      number,
      RscStaffRoleOptionResponsePresenter
    >();

    for (const option of options) {
      const mapped = this.toOption(
        option.key,
        option.label,
        option.slug ?? option.key,
        option.icon ?? null,
      );

      staticOptionsByOptionId.set(option.id, mapped);
    }

    for (const groupOption of groupOptions) {
      if (!groupIds.has(groupOption.groupId)) continue;
      const mapped = staticOptionsByOptionId.get(groupOption.optionId);
      if (!mapped) continue;

      const bucket = staticOptionsByGroupId.get(groupOption.groupId);
      if (bucket) bucket.push(mapped);
      else staticOptionsByGroupId.set(groupOption.groupId, [mapped]);
    }

    const resolvedGroupOptionsByGroupId = new Map<
      number,
      RscStaffRoleOptionResponsePresenter[]
    >();
    for (const group of groups) {
      resolvedGroupOptionsByGroupId.set(
        group.id,
        this.resolveGroupOptions(
          group.sourceType,
          group.id,
          languageOptions,
          gameOptions,
          staticOptionsByGroupId,
        ),
      );
    }

    const linksByRoleAndGroup = new Map<
      number,
      Map<number, RscStaffRoleOptionLinkEntity[]>
    >();

    for (const link of filteredLinks) {
      const byGroup = linksByRoleAndGroup.get(link.roleId);
      if (byGroup) {
        const bucket = byGroup.get(link.groupId);
        if (bucket) bucket.push(link);
        else byGroup.set(link.groupId, [link]);
        continue;
      }

      linksByRoleAndGroup.set(link.roleId, new Map([[link.groupId, [link]]]));
    }

    return roles.map((role) => {
      const mappedRole = this.createStaffRole({
        id: role.key,
        slug: role.slug,
        label: role.label,
        icon: role.icon ?? null,
      });

      const byGroup = linksByRoleAndGroup.get(role.id);
      if (!byGroup) return mappedRole;

      for (const [groupId, groupLinks] of byGroup.entries()) {
        const group = groupsById.get(groupId);
        if (!group) continue;
        if (!isStaffRoleGroupKey(group.key)) continue;

        const sourceOptions = resolvedGroupOptionsByGroupId.get(groupId) ?? [];
        const hasAll = groupLinks.some((link) => link.optionId === null);

        const resolvedOptions = hasAll
          ? sourceOptions
          : this.resolveExplicitOptions(groupLinks, staticOptionsByOptionId);

        if (!resolvedOptions.length) continue;

        (
          mappedRole as unknown as Record<
            StaffRoleGroupKey,
            RscStaffRoleOptionResponsePresenter[]
          >
        )[group.key] = resolvedOptions;
      }

      return mappedRole;
    });
  }

  private resolveGroupOptions(
    sourceType: RscStaffOptionGroupSourceType,
    groupId: number,
    languageOptions: RscStaffRoleOptionResponsePresenter[],
    gameOptions: RscStaffRoleOptionResponsePresenter[],
    staticOptionsByGroupId: Map<number, RscStaffRoleOptionResponsePresenter[]>,
  ): RscStaffRoleOptionResponsePresenter[] {
    if (sourceType === 'LANGUAGES') return languageOptions;
    if (sourceType === 'GAMES') return gameOptions;
    return staticOptionsByGroupId.get(groupId) ?? [];
  }

  private resolveExplicitOptions(
    links: RscStaffRoleOptionLinkEntity[],
    staticOptionsByOptionId: Map<number, RscStaffRoleOptionResponsePresenter>,
  ): RscStaffRoleOptionResponsePresenter[] {
    const dedupe = new Set<string>();
    const result: RscStaffRoleOptionResponsePresenter[] = [];

    for (const link of links) {
      if (!link.optionId) continue;
      const option = staticOptionsByOptionId.get(link.optionId);
      if (!option) continue;
      if (dedupe.has(option.id)) continue;
      dedupe.add(option.id);
      result.push(option);
    }

    return result;
  }
}
