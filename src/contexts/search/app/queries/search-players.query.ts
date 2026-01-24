import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccessTokenPayload } from '@/contexts/auth/app/ports/token.port';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { UserGameEntity } from '@/contexts/players/infra/entities/game/user-game.entity';
import { BillingPlanKeyEnum } from '@/contexts/billing/infra/entitlements/billing-plans.registry';
import { SearchPremiumFiltersError } from '../../domain/errors/search.errors';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerSearchDocument } from '../../infra/typesense/player-search.types';
import { RscProfileBadgePresenter, UserGamePresenter } from '@neeft-sas/shared';
import { TypesenseService } from '../../infra/typesense/typesense.service';
import { PLAYER_SEARCH_COLLECTION } from '../../infra/typesense/player-search.schema';
import { SearchPlayersQueryDto } from '../../api/dtos/search-players.query.dto';
import { buildPlayerGameKey } from '../../infra/typesense/player-search.constants';

type SearchPlayersResult = {
  data: Array<{
    id: string;
    username: string;
    slug: string;
    profilePicture: string | null;
    bannerPicture: string | null;
    createdAt: string;
    badges: RscProfileBadgePresenter[];
    games: UserGamePresenter[];
  }>;
  meta: {
    found: number;
    page: number;
    perPage: number;
    outOf: number;
  };
};

@Injectable()
export class SearchPlayersQuery {
  constructor(
    private readonly typesense: TypesenseService,
    @InjectRepository(UserProfileEntity) private readonly profilesRepo: Repository<UserProfileEntity>,
    @InjectRepository(UserGameEntity) private readonly gamesRepo: Repository<UserGameEntity>,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(query: SearchPlayersQueryDto, user?: AccessTokenPayload): Promise<SearchPlayersResult> {
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
    const sortBy = q === '*'
      ? 'hasRecruitableGame:desc,hasGame:desc,profileScore:desc'
      : '_text_match:desc,hasRecruitableGame:desc,hasGame:desc,profileScore:desc';

    const response = await this.typesense.client
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

    const hits = response.hits ?? [];
    const badgeMap = this.buildBadgeMap();
    const profileIds = hits
      .map((hit) => (hit.document as PlayerSearchDocument).id)
      .filter((id): id is string => Boolean(id));
    const gamesMap = await this.loadUserGamesMap(profileIds, query.gameId);

    return {
      data: hits.map((hit) =>
        this.mapDocument(hit.document as PlayerSearchDocument, badgeMap, gamesMap),
      ),
      meta: {
        found: response.found ?? 0,
        page: response.page ?? page,
        perPage,
        outOf: response.out_of ?? 0,
      },
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
    if (query.minExperienceCount !== undefined) filters.push('minExperienceCount');
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

    if (query.gameId !== undefined) {
      filters.push(`gameIds:=[${query.gameId}]`);
    }

    if (query.gameId !== undefined) {
      const gameId = query.gameId;
      if (query.positionIds && query.positionIds.length) {
        const values = query.positionIds.map((id) => buildPlayerGameKey(gameId, id)).join(',');
        filters.push(`gamePositionKeys:=[${values}]`);
      }

      if (query.platformIds && query.platformIds.length) {
        const values = query.platformIds.map((id) => buildPlayerGameKey(gameId, id)).join(',');
        filters.push(`gamePlatformKeys:=[${values}]`);
      }

      if (query.characterIds && query.characterIds.length) {
        const values = query.characterIds.map((id) => buildPlayerGameKey(gameId, id)).join(',');
        filters.push(`gameCharacterKeys:=[${values}]`);
      }

      if (query.rankMin !== undefined) {
        filters.push(`gameRankOrderKeys:>=${buildPlayerGameKey(gameId, query.rankMin)}`);
      }

      if (query.rankMax !== undefined) {
        filters.push(`gameRankOrderKeys:<=${buildPlayerGameKey(gameId, query.rankMax)}`);
      }
    }

    return filters.join(' && ');
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
    gamesMap: Map<string, UserGamePresenter[]>,
  ): {
    id: string;
    username: string;
    slug: string;
    profilePicture: string | null;
    bannerPicture: string | null;
    createdAt: string;
    badges: RscProfileBadgePresenter[];
    games: UserGamePresenter[];
  } {
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
      createdAt: Number.isNaN(createdAt.getTime()) ? new Date(0).toISOString() : createdAt.toISOString(),
      badges,
      games: gamesMap.get(doc.id) ?? [],
    };
  }

  private async loadUserGamesMap(
    profileIds: string[],
    preferredGameId?: number,
  ): Promise<Map<string, UserGamePresenter[]>> {
    if (!profileIds.length) return new Map();

    const games = await this.gamesRepo.find({
      where: { profile: { id: In(profileIds) } },
      relations: { profile: true },
      order: { id: 'ASC' },
    });

    const map = new Map<string, UserGamePresenter[]>();
    for (const game of games) {
      const profileId = game.profile?.id;
      if (!profileId) continue;
      const entry = map.get(profileId);
      const mapped = this.mapUserGame(game);
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

  private sortUserGames(games: UserGamePresenter[], preferredGameId?: number): UserGamePresenter[] {
    return games.sort((a, b) => {
      const aPreferred = preferredGameId !== undefined && a.gameId === preferredGameId;
      const bPreferred = preferredGameId !== undefined && b.gameId === preferredGameId;
      if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
      if (a.isRecruitable !== b.isRecruitable) return a.isRecruitable ? -1 : 1;
      return a.gameId - b.gameId;
    });
  }

  private mapUserGame(entity: UserGameEntity): UserGamePresenter {
    const toIdList = <T>(items: T[] | null | undefined, mapper: (item: T) => number | null | undefined) => {
      if (!Array.isArray(items)) return [];
      return items
        .map(mapper)
        .filter((id): id is number => Number.isInteger(id) && id > 0);
    };

    const modeRanks = (entity.modeRanks ?? [])
      .map((relation) => {
        const modeId = relation.mode?.rscModeId;
        const rankId = relation.rank?.rscRankId;
        if (!modeId || !rankId) return null;
        return { modeId, rankId };
      })
      .filter((item): item is { modeId: number; rankId: number } => Boolean(item));

    return {
      id: entity.id,
      gameId: entity.rscGame?.id ?? 0,
      isRecruitable: entity.isRecruitable,
      isFavoriteGame: entity.isFavoriteGame,
      trackerUrl: entity.trackerUrl ?? null,
      positionIds: toIdList(entity.positions, (relation) => relation.position?.id),
      platformIds: toIdList(entity.platforms, (relation) => relation.platform?.id),
      characterIds: toIdList(entity.characters, (relation) => relation.character?.id),
      modeRanks,
      account: this.mapUserGameAccount(entity),
    };
  }

  private mapUserGameAccount(entity: UserGameEntity): UserGamePresenter['account'] {
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
      default:
        return null;
    }
  }
}
