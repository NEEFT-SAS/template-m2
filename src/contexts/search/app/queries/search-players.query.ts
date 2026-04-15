import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccessTokenPayload } from '@/contexts/auth/app/ports/token.port';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { UserGameEntity } from '@/contexts/players/infra/entities/game/user-game.entity';
import { BillingPlanKeyEnum } from '@/contexts/billing/infra/entitlements/billing-plans.registry';
import {
  SearchPremiumFiltersError,
  SearchProviderUnavailableError,
} from '../../domain/errors/search.errors';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerSearchDocument } from '../../infra/typesense/player-search.types';
import {
  RscGamePresenter,
  RscProfileBadgePresenter,
  SearchPlayerGameModeRankPresenter,
  SearchPlayerGamePresenter,
  SearchPlayerPresenter,
  SearchPlayersPresenter,
  UserGamePresenter,
} from '@neeft-sas/shared';
import type { SearchPlayersQueryDto } from '../../api/dtos/search-query.dtos';
import { TypesenseService } from '../../infra/typesense/typesense.service';
import { PLAYER_SEARCH_COLLECTION } from '../../infra/typesense/player-search.schema';
import {
  buildPlayerGameEloKey,
  buildPlayerGameKey,
} from '../../infra/typesense/player-search.constants';

@Injectable()
export class SearchPlayersQuery {
  private readonly logger = new Logger(SearchPlayersQuery.name);

  constructor(
    private readonly typesense: TypesenseService,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(UserGameEntity)
    private readonly gamesRepo: Repository<UserGameEntity>,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(
    query: SearchPlayersQueryDto,
    user?: AccessTokenPayload,
  ): Promise<SearchPlayersPresenter> {
    const premiumFiltersUsed = this.getPremiumFiltersUsed(query);
    if (premiumFiltersUsed.length) {
      const isPremium = await this.isPremiumUser(user);
      if (!isPremium) {
        throw new SearchPremiumFiltersError(premiumFiltersUsed);
      }
    }

    const q = query.q && query.q.trim() !== '' ? query.q.trim() : '*';
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const filterBy = this.buildFilters(query);
    const sortBy =
      q === '*'
        ? 'hasRecruitableGame:desc,profileScore:desc,createdAt:desc'
        : '_text_match:desc,hasRecruitableGame:desc,profileScore:desc';

    let response: {
      hits?: Array<{ document: unknown }>;
      found?: number;
      page?: number;
      out_of?: number;
    };

    try {
      response = await this.typesense.client
        .collections(PLAYER_SEARCH_COLLECTION)
        .documents()
        .search({
          q,
          query_by: 'username,slug',
          page,
          per_page: perPage,
          filter_by: filterBy || undefined,
          sort_by: sortBy,
        });
    } catch (error) {
      this.logger.error(
        `Typesense search failed for collection "${PLAYER_SEARCH_COLLECTION}"`,
        (error as { stack?: string })?.stack,
      );

      throw new SearchProviderUnavailableError(
        this.extractSearchErrorDetails(error),
      );
    }

    const hits = response.hits ?? [];
    const badgeMap = this.buildBadgeMap();
    const profileIds = hits
      .map((hit) => (hit.document as PlayerSearchDocument).id)
      .filter((id): id is string => Boolean(id));
    const gamesMap = await this.loadUserGamesMap(profileIds, query.gameId);

    return {
      data: hits.map((hit) =>
        this.mapDocument(
          hit.document as PlayerSearchDocument,
          badgeMap,
          gamesMap,
        ),
      ),
      meta: {
        found: response.found ?? 0,
        page: response.page ?? page,
        perPage,
        outOf: response.out_of ?? 0,
      },
    };
  }

  private extractSearchErrorDetails(error: unknown): Record<string, unknown> {
    if (!error || typeof error !== 'object') {
      return { message: String(error ?? 'Unknown search provider error') };
    }

    const err = error as {
      name?: unknown;
      message?: unknown;
      code?: unknown;
      status?: unknown;
      response?: { status?: unknown; data?: unknown };
    };

    return {
      name: typeof err.name === 'string' ? err.name : 'Error',
      message:
        typeof err.message === 'string' ? err.message : 'Search provider error',
      ...(typeof err.code === 'string' ? { code: err.code } : {}),
      ...(typeof err.status === 'number' ? { status: err.status } : {}),
      ...(typeof err.response?.status === 'number'
        ? { responseStatus: err.response.status }
        : {}),
    };
  }

  private async isPremiumUser(user?: AccessTokenPayload): Promise<boolean> {
    const roles = (user as { roles?: string[] } | undefined)?.roles ?? [];
    if (Array.isArray(roles) && roles.includes('admin')) return true;

    const profileId = user?.pid;
    if (!profileId) return false;

    const profile = await this.profilesRepo.findOne({
      where: { id: profileId },
      select: ['billingPlanKey'],
    });

    if (!profile) return false;
    return profile.billingPlanKey !== BillingPlanKeyEnum.FREE;
  }

  private getPremiumFiltersUsed(query: SearchPlayersQueryDto): string[] {
    const filters: string[] = [];

    if (query.minProfileScore !== undefined) filters.push('minProfileScore');
    if (query.minExperienceCount !== undefined)
      filters.push('minExperienceCount');
    if (query.badgeIds && query.badgeIds.length) filters.push('badgeIds');
    if (query.hasSocialLinks !== undefined) filters.push('hasSocialLinks');

    return filters;
  }

  private buildFilters(query: SearchPlayersQueryDto): string {
    const filters: string[] = [];
    const quote = (value: string) => `\`${value}\``;

    if (query.nationalityId) {
      filters.push(`nationalityId:=${quote(query.nationalityId)}`);
    }

    if (query.languageIds && query.languageIds.length) {
      const values = query.languageIds.map(quote).join(',');
      filters.push(`languageIds:=[${values}]`);
    }

    if (query.badgeIds && query.badgeIds.length) {
      filters.push(`badgeIds:=[${query.badgeIds.join(',')}]`);
    }

    if (query.hasProfilePicture !== undefined) {
      filters.push(`hasProfilePicture:=${query.hasProfilePicture}`);
    }

    if (query.hasSocialLinks !== undefined) {
      filters.push(`socialLinksCount:${query.hasSocialLinks ? '>0' : '=0'}`);
    }

    if (query.minExperienceCount !== undefined) {
      filters.push(`experienceCount:>=${query.minExperienceCount}`);
    }

    if (query.minProfileScore !== undefined) {
      filters.push(`profileScore:>=${query.minProfileScore}`);
    }

    const { min: ageMin, max: ageMax } = this.normalizeRange(
      query.ageMin,
      query.ageMax,
    );
    const birthDateRange = this.getBirthDateRangeFromAgeBounds(ageMin, ageMax);
    if (birthDateRange.minBirthDate !== undefined) {
      filters.push(`birthDate:>=${birthDateRange.minBirthDate}`);
    }
    if (birthDateRange.maxBirthDate !== undefined) {
      filters.push(`birthDate:<=${birthDateRange.maxBirthDate}`);
    }

    if (query.gameId !== undefined) {
      filters.push(`gameIds:=[${query.gameId}]`);
    }

    if (query.gameId !== undefined) {
      const gameId = query.gameId;
      const { min: rankMin, max: rankMax } = this.normalizeRange(
        query.rankMin,
        query.rankMax,
      );
      const { min: eloMin, max: eloMax } = this.normalizeRange(
        query.eloMin,
        query.eloMax,
      );

      if (query.recruitable === 'available') {
        filters.push(`recruitableGameIds:=[${gameId}]`);
      } else if (query.recruitable === 'unavailable') {
        filters.push(`nonRecruitableGameIds:=[${gameId}]`);
      }

      if (query.positionIds && query.positionIds.length) {
        const values = query.positionIds
          .map((id) => buildPlayerGameKey(gameId, id))
          .join(',');
        filters.push(`gamePositionKeys:=[${values}]`);
      }

      if (query.platformIds && query.platformIds.length) {
        const values = query.platformIds
          .map((id) => buildPlayerGameKey(gameId, id))
          .join(',');
        filters.push(`gamePlatformKeys:=[${values}]`);
      }

      if (query.characterIds && query.characterIds.length) {
        const values = query.characterIds
          .map((id) => buildPlayerGameKey(gameId, id))
          .join(',');
        filters.push(`gameCharacterKeys:=[${values}]`);
      }

      if (query.modeId !== undefined) {
        filters.push(
          `gameModeKeys:=[${buildPlayerGameKey(gameId, query.modeId)}]`,
        );
      }

      if (rankMin !== undefined) {
        filters.push(
          `gameRankOrderKeys:>=${buildPlayerGameKey(gameId, rankMin)}`,
        );
      }

      if (rankMax !== undefined) {
        filters.push(
          `gameRankOrderKeys:<=${buildPlayerGameKey(gameId, rankMax)}`,
        );
      }

      if (eloMin !== undefined) {
        filters.push(`gameEloKeys:>=${buildPlayerGameEloKey(gameId, eloMin)}`);
      }

      if (eloMax !== undefined) {
        filters.push(`gameEloKeys:<=${buildPlayerGameEloKey(gameId, eloMax)}`);
      }
    }

    if (query.gameId === undefined) {
      if (query.recruitable === 'available') {
        filters.push('hasRecruitableGame:=true');
      } else if (query.recruitable === 'unavailable') {
        filters.push('hasRecruitableGame:=false');
      }
    }

    return filters.join(' && ');
  }

  private normalizeRange(
    min?: number,
    max?: number,
  ): { min?: number; max?: number } {
    if (min === undefined && max === undefined) return {};
    if (min !== undefined && max !== undefined && min > max) {
      return { min: max, max: min };
    }
    return { min, max };
  }

  private getBirthDateRangeFromAgeBounds(
    minAge?: number,
    maxAge?: number,
  ): { minBirthDate?: number; maxBirthDate?: number } {
    if (minAge === undefined && maxAge === undefined) return {};

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const range: { minBirthDate?: number; maxBirthDate?: number } = {};

    if (maxAge !== undefined) {
      const minBirthDate = this.shiftYears(startOfToday, -(maxAge + 1));
      minBirthDate.setDate(minBirthDate.getDate() + 1);
      range.minBirthDate = minBirthDate.getTime();
    }

    if (minAge !== undefined) {
      const maxBirthDate = this.shiftYears(endOfToday, -minAge);
      range.maxBirthDate = maxBirthDate.getTime();
    }

    return range;
  }

  private shiftYears(date: Date, years: number): Date {
    const copy = new Date(date);
    copy.setFullYear(copy.getFullYear() + years);
    return copy;
  }

  private buildBadgeMap(): Map<number, RscProfileBadgePresenter> {
    const snapshot = this.resourcesStore.getSnapshot();
    const map = new Map<number, RscProfileBadgePresenter>();
    for (const badge of snapshot.rscProfileBadges) {
      map.set(badge.id, badge);
    }
    return map;
  }

  private mapDocument(
    doc: PlayerSearchDocument,
    badgeMap: Map<number, RscProfileBadgePresenter>,
    gamesMap: Map<string, SearchPlayerGamePresenter[]>,
  ): SearchPlayerPresenter {
    const createdAt = new Date(Number(doc.createdAt));
    const badgeIds = doc.badgeIds ?? [];
    const badges = badgeIds
      .map((id) => badgeMap.get(id))
      .filter((badge): badge is RscProfileBadgePresenter => Boolean(badge))
      .sort((a, b) => a.priority - b.priority);

    return {
      id: doc.id,
      username: doc.username,
      slug: doc.slug,
      profilePicture: doc.profilePicture ?? null,
      bannerPicture: doc.bannerPicture ?? null,
      createdAt: Number.isNaN(createdAt.getTime())
        ? new Date(0).toISOString()
        : createdAt.toISOString(),
      completenessScore: Number(doc.completenessScore ?? 0),
      trustScore: Number(doc.trustScore ?? 0),
      profileScore: Number(doc.profileScore ?? 0),
      badges,
      games: gamesMap.get(doc.id) ?? [],
    } as SearchPlayerPresenter;
  }

  private async loadUserGamesMap(
    profileIds: string[],
    preferredGameId?: number,
  ): Promise<Map<string, SearchPlayerGamePresenter[]>> {
    if (!profileIds.length) return new Map();

    const resourcesSnapshot = this.resourcesStore.getSnapshot();
    const gamesById = new Map<number, RscGamePresenter>(
      resourcesSnapshot.rscGames.map((game) => [game.id, game]),
    );

    const games = await this.gamesRepo.find({
      where: { profile: { id: In(profileIds) } },
      relations: { profile: true },
      order: { id: 'ASC' },
    });

    const map = new Map<string, SearchPlayerGamePresenter[]>();
    for (const game of games) {
      const profileId = game.profile?.id;
      if (!profileId) continue;
      const entry = map.get(profileId);
      const mapped = this.mapUserGame(
        game,
        gamesById.get(game.rscGame?.id ?? 0) ?? null,
      );
      if (entry) {
        entry.push(mapped);
      } else {
        map.set(profileId, [mapped]);
      }
    }

    for (const [profileId, games] of map.entries()) {
      map.set(profileId, this.sortUserGames(games, preferredGameId));
    }

    return map;
  }

  private sortUserGames(
    games: SearchPlayerGamePresenter[],
    preferredGameId?: number,
  ): SearchPlayerGamePresenter[] {
    return games.sort((a, b) => {
      const aGameId = a.game?.id ?? 0;
      const bGameId = b.game?.id ?? 0;
      const aPreferred =
        preferredGameId !== undefined && aGameId === preferredGameId;
      const bPreferred =
        preferredGameId !== undefined && bGameId === preferredGameId;
      if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
      if (a.isRecruitable !== b.isRecruitable) return a.isRecruitable ? -1 : 1;
      return aGameId - bGameId;
    });
  }

  private mapUserGame(
    entity: UserGameEntity,
    gameResource: RscGamePresenter | null,
  ): SearchPlayerGamePresenter {
    const toIdList = <T>(
      items: T[] | null | undefined,
      mapper: (item: T) => number | null | undefined,
    ) => {
      if (!Array.isArray(items)) return [];
      return items
        .map(mapper)
        .filter((id): id is number => Number.isInteger(id) && id > 0);
    };

    const modesById = new Map(
      (gameResource?.rscGameModes ?? []).map((item) => [item.id, item]),
    );
    const ranksById = new Map(
      (gameResource?.rscGameRanks ?? []).map((item) => [item.id, item]),
    );

    const modeRanks = (entity.modeRanks ?? [])
      .map((relation) => {
        const modeId = relation.mode?.rscModeId;
        const rankId = relation.rank?.rscRankId;
        if (!modeId || !rankId) return null;
        return {
          elo: relation.elo ?? null,
          rscGameMode: modesById.get(modeId) ?? null,
          rscGameRank: ranksById.get(rankId) ?? null,
        } satisfies SearchPlayerGameModeRankPresenter;
      })
      .filter((item): item is SearchPlayerGameModeRankPresenter =>
        Boolean(item),
      );

    const positionIds = toIdList(
      entity.positions,
      (relation) => relation.position?.id,
    );
    const platformIds = toIdList(
      entity.platforms,
      (relation) => relation.platform?.id,
    );
    const characterIds = toIdList(
      entity.characters,
      (relation) => relation.character?.id,
    );

    return {
      id: entity.id,
      isRecruitable: entity.isRecruitable,
      isFavoriteGame: entity.isFavoriteGame,
      trackerUrl: entity.trackerUrl ?? null,
      game: gameResource,
      rscGamePositions: (gameResource?.rscGamePositions ?? []).filter((item) =>
        positionIds.includes(item.id),
      ),
      rscGamePlatforms: (gameResource?.rscGamePlatforms ?? []).filter((item) =>
        platformIds.includes(item.id),
      ),
      rscGameCharacters: (gameResource?.rscGameCharacters ?? []).filter(
        (item) => characterIds.includes(item.id),
      ),
      modeRanks,
      account: this.mapUserGameAccount(entity),
    };
  }

  private mapUserGameAccount(
    entity: UserGameEntity,
  ): UserGamePresenter['account'] {
    const slug = entity.rscGame?.slug?.toLowerCase();
    if (!slug) return null;

    switch (slug) {
      case 'league-of-legends': {
        const profile = entity.leagueOfLegendsProfile;
        if (!profile?.username || !profile.tagLine) return null;
        return {
          username: profile.username,
          tagLine: profile.tagLine,
          ...(profile.region ? { region: profile.region } : {}),
        };
      }
      case 'rocket-league': {
        const profile = entity.rocketLeagueProfile;
        return profile?.username ? { username: profile.username } : null;
      }
      case 'valorant': {
        const profile = entity.valorantProfile;
        if (!profile?.username || !profile.tagLine) return null;
        return { username: profile.username, tagLine: profile.tagLine };
      }
      case 'brawl-stars': {
        const profile = entity.brawlStarsProfile;
        return profile?.username ? { username: profile.username } : null;
      }
      case 'fortnite': {
        const profile = entity.fortniteProfile;
        return profile?.username ? { username: profile.username } : null;
      }
      case 'counter-strike-2': {
        const profile = entity.counterStrike2Profile;
        return profile?.username ? { username: profile.username } : null;
      }
      case 'rainbow-six-siege': {
        const profile = entity.rainbowSixSiegeProfile;
        return profile?.username ? { username: profile.username } : null;
      }
      default:
        return null;
    }
  }
}
