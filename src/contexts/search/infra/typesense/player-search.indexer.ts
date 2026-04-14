import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { TypesenseService } from './typesense.service';
import {
  PLAYER_SEARCH_COLLECTION,
  playerSearchSchema,
} from './player-search.schema';
import { PlayerSearchDocument } from './player-search.types';
import { PlayerScoreService } from '../../app/services/player-score.service';
import {
  buildPlayerGameEloKey,
  buildPlayerGameKey,
} from './player-search.constants';

type BaseProfileRow = {
  id: string;
  username: string;
  slug: string;
  description: string | null;
  citation: string | null;
  profilePicture: string | null;
  bannerPicture: string | null;
  nationalityId: string | null;
  birthDate: Date | string;
  createdAt: Date | string;
  isEmailVerified: boolean | number | string | null;
  accountStatus: string | null;
  lastLoginAt: Date | string | null;
};

type CollectionState = 'ready' | 'empty' | 'created' | 'recreated';

@Injectable()
export class PlayerSearchIndexer implements OnModuleInit {
  private readonly logger = new Logger(PlayerSearchIndexer.name);
  private readonly initRetryDelayMs = 10_000;

  constructor(
    private readonly typesense: TypesenseService,
    private readonly playerScore: PlayerScoreService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UserProfileEntity)
    private readonly profilesRepo: Repository<UserProfileEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    void this.runInitSyncWithRetry();
  }

  private async runInitSyncWithRetry(): Promise<void> {
    try {
      const state = await this.ensureCollection();
      const shouldSyncByState = state !== 'ready';
      const shouldSyncByCount = await this.isCollectionOutOfSync();

      if (!shouldSyncByState && !shouldSyncByCount) return;

      const result = await this.syncAll();
      this.logger.log(
        `Typesense index synchronized on init (${state}${shouldSyncByCount ? ', count-mismatch' : ''}): ${result.indexed} documents.`,
      );
    } catch (err: any) {
      this.logger.error(`Typesense init failed: ${err?.message ?? err}`);
      setTimeout(() => {
        void this.runInitSyncWithRetry();
      }, this.initRetryDelayMs);
    }
  }

  async ensureCollection(): Promise<CollectionState> {
    try {
      const collection = await this.typesense.client
        .collections(PLAYER_SEARCH_COLLECTION)
        .retrieve();

      const existingFields = new Set(
        (collection.fields ?? []).map((field) => field.name),
      );
      const missingFields = playerSearchSchema.fields
        .map((field) => field.name)
        .filter((fieldName) => !existingFields.has(fieldName));

      if (!missingFields.length) {
        return Number(collection.num_documents ?? 0) > 0 ? 'ready' : 'empty';
      }

      this.logger.warn(
        `Typesense collection "${PLAYER_SEARCH_COLLECTION}" missing fields (${missingFields.join(', ')}), recreating.`,
      );
      await this.typesense.client
        .collections(PLAYER_SEARCH_COLLECTION)
        .delete();
      await this.typesense.client.collections().create(playerSearchSchema);
      this.logger.log(
        `Typesense collection recreated: ${PLAYER_SEARCH_COLLECTION}`,
      );
      return 'recreated';
    } catch (err: any) {
      const status = err?.httpStatus ?? err?.status;
      if (status === 404) {
        await this.typesense.client.collections().create(playerSearchSchema);
        this.logger.log(
          `Typesense collection created: ${PLAYER_SEARCH_COLLECTION}`,
        );
        return 'created';
      }
      throw err;
    }
  }

  async syncAll(): Promise<{ indexed: number }> {
    await this.ensureCollection();

    const baseProfiles = await this.fetchBaseProfiles();
    if (!baseProfiles.length) {
      return { indexed: 0 };
    }

    const [
      languageMap,
      badgeMap,
      experienceMap,
      educationMap,
      professionalMap,
      socialLinksMap,
      recruitableGameCountMap,
      gameIdsMap,
      recruitableGameIdsMap,
      nonRecruitableGameIdsMap,
      gamePositionKeysMap,
      gamePlatformKeysMap,
      gameCharacterKeysMap,
      gameModeKeysMap,
      gameRankOrderKeysMap,
      gameEloKeysMap,
      profileReportStatsMap,
      verifiedBadgeId,
    ] = await Promise.all([
      this.loadStringArrayMap('user_profile_languages', 'language_id'),
      this.loadIntArrayMap('user_badges', 'rsc_badge_id'),
      this.loadCountMap('user_experiences'),
      this.loadCountMap('user_profile_school_experiences', 'profile_id'),
      this.loadCountMap('user_profile_professional_experiences', 'profile_id'),
      this.loadCountMap('user_social_links'),
      this.loadRecruitableGameCountMap(),
      this.loadGameIdsMap(),
      this.loadRecruitableGameIdsMap(),
      this.loadNonRecruitableGameIdsMap(),
      this.loadGameRelationKeysMap('player_game_positions', 'rsc_position_id'),
      this.loadGameRelationKeysMap('player_game_platforms', 'rsc_platform_id'),
      this.loadGameRelationKeysMap(
        'player_game_characters',
        'rsc_character_id',
      ),
      this.loadGameModeKeysMap(),
      this.loadGameRankOrderKeysMap(),
      this.loadGameEloKeysMap(),
      this.loadProfileReportStatsMap(),
      this.loadVerifiedBadgeId(),
    ]);

    const documents = baseProfiles.map((profile) =>
      this.buildDocument(profile, {
        languageIds: languageMap.get(profile.id) ?? [],
        badgeIds: badgeMap.get(profile.id) ?? [],
        experienceCount: experienceMap.get(profile.id) ?? 0,
        educationCount: educationMap.get(profile.id) ?? 0,
        professionalExperienceCount: professionalMap.get(profile.id) ?? 0,
        socialLinksCount: socialLinksMap.get(profile.id) ?? 0,
        hasRecruitableGame: (recruitableGameCountMap.get(profile.id) ?? 0) > 0,
        gameIds: gameIdsMap.get(profile.id) ?? [],
        recruitableGameIds: recruitableGameIdsMap.get(profile.id) ?? [],
        nonRecruitableGameIds: nonRecruitableGameIdsMap.get(profile.id) ?? [],
        gamePositionKeys: gamePositionKeysMap.get(profile.id) ?? [],
        gamePlatformKeys: gamePlatformKeysMap.get(profile.id) ?? [],
        gameCharacterKeys: gameCharacterKeysMap.get(profile.id) ?? [],
        gameModeKeys: gameModeKeysMap.get(profile.id) ?? [],
        gameRankOrderKeys: gameRankOrderKeysMap.get(profile.id) ?? [],
        gameEloKeys: gameEloKeysMap.get(profile.id) ?? [],
        unresolvedReportsCount:
          profileReportStatsMap.get(profile.id)?.unresolvedCount ?? 0,
        resolvedNegativeReportsCount:
          profileReportStatsMap.get(profile.id)?.resolvedCount ?? 0,
        hasVerifiedBadge:
          verifiedBadgeId !== null &&
          (badgeMap.get(profile.id) ?? []).includes(verifiedBadgeId),
      }),
    );

    await this.importDocuments(documents);
    return { indexed: documents.length };
  }

  async syncBySlug(slug: string): Promise<{ indexed: number }> {
    await this.ensureCollection();

    const base = await this.fetchBaseProfileBySlug(slug);
    if (!base) return { indexed: 0 };

    const [
      languageIds,
      badgeIds,
      experienceCount,
      educationCount,
      professionalExperienceCount,
      socialLinksCount,
      recruitableGameCount,
      gameIds,
      recruitableGameIds,
      nonRecruitableGameIds,
      gamePositionKeys,
      gamePlatformKeys,
      gameCharacterKeys,
      gameModeKeys,
      gameRankOrderKeys,
      gameEloKeys,
      profileReportStats,
      verifiedBadgeId,
    ] = await Promise.all([
      this.loadStringArrayByProfile(
        'user_profile_languages',
        'language_id',
        base.id,
      ),
      this.loadIntArrayByProfile('user_badges', 'rsc_badge_id', base.id),
      this.loadCountByProfile('user_experiences', base.id),
      this.loadCountByProfile(
        'user_profile_school_experiences',
        base.id,
        'profile_id',
      ),
      this.loadCountByProfile(
        'user_profile_professional_experiences',
        base.id,
        'profile_id',
      ),
      this.loadCountByProfile('user_social_links', base.id),
      this.loadRecruitableGameCountByProfile(base.id),
      this.loadGameIdsByProfile(base.id),
      this.loadRecruitableGameIdsByProfile(base.id),
      this.loadNonRecruitableGameIdsByProfile(base.id),
      this.loadGameRelationKeysByProfile(
        'player_game_positions',
        'rsc_position_id',
        base.id,
      ),
      this.loadGameRelationKeysByProfile(
        'player_game_platforms',
        'rsc_platform_id',
        base.id,
      ),
      this.loadGameRelationKeysByProfile(
        'player_game_characters',
        'rsc_character_id',
        base.id,
      ),
      this.loadGameModeKeysByProfile(base.id),
      this.loadGameRankOrderKeysByProfile(base.id),
      this.loadGameEloKeysByProfile(base.id),
      this.loadProfileReportStatsByProfile(base.id),
      this.loadVerifiedBadgeId(),
    ]);

    const document = this.buildDocument(base, {
      languageIds,
      badgeIds,
      experienceCount,
      educationCount,
      professionalExperienceCount,
      socialLinksCount,
      hasRecruitableGame: recruitableGameCount > 0,
      gameIds,
      recruitableGameIds,
      nonRecruitableGameIds,
      gamePositionKeys,
      gamePlatformKeys,
      gameCharacterKeys,
      gameModeKeys,
      gameRankOrderKeys,
      gameEloKeys,
      unresolvedReportsCount: profileReportStats.unresolvedCount,
      resolvedNegativeReportsCount: profileReportStats.resolvedCount,
      hasVerifiedBadge:
        verifiedBadgeId !== null && badgeIds.includes(verifiedBadgeId),
    });

    await this.importDocuments([document]);
    return { indexed: 1 };
  }

  private async fetchBaseProfiles(): Promise<BaseProfileRow[]> {
    return this.profilesRepo
      .createQueryBuilder('profile')
      .leftJoin('profile.nationality', 'nationality')
      .leftJoin(
        UserCredentialsEntity,
        'credentials',
        'credentials.id = profile.userCredentialId',
      )
      .select('profile.id', 'id')
      .addSelect('profile.username', 'username')
      .addSelect('profile.slug', 'slug')
      .addSelect('profile.description', 'description')
      .addSelect('profile.citation', 'citation')
      .addSelect('profile.profilePicture', 'profilePicture')
      .addSelect('profile.bannerPicture', 'bannerPicture')
      .addSelect('profile.birthDate', 'birthDate')
      .addSelect('profile.createdAt', 'createdAt')
      .addSelect('nationality.id', 'nationalityId')
      .addSelect('credentials.isEmailVerified', 'isEmailVerified')
      .addSelect('credentials.status', 'accountStatus')
      .addSelect('credentials.lastLoginAt', 'lastLoginAt')
      .getRawMany<BaseProfileRow>();
  }

  private async fetchBaseProfileBySlug(
    slug: string,
  ): Promise<BaseProfileRow | null> {
    const row = await this.profilesRepo
      .createQueryBuilder('profile')
      .leftJoin('profile.nationality', 'nationality')
      .leftJoin(
        UserCredentialsEntity,
        'credentials',
        'credentials.id = profile.userCredentialId',
      )
      .select('profile.id', 'id')
      .addSelect('profile.username', 'username')
      .addSelect('profile.slug', 'slug')
      .addSelect('profile.description', 'description')
      .addSelect('profile.citation', 'citation')
      .addSelect('profile.profilePicture', 'profilePicture')
      .addSelect('profile.bannerPicture', 'bannerPicture')
      .addSelect('profile.birthDate', 'birthDate')
      .addSelect('profile.createdAt', 'createdAt')
      .addSelect('nationality.id', 'nationalityId')
      .addSelect('credentials.isEmailVerified', 'isEmailVerified')
      .addSelect('credentials.status', 'accountStatus')
      .addSelect('credentials.lastLoginAt', 'lastLoginAt')
      .where('LOWER(profile.slug) = LOWER(:slug)', { slug })
      .getRawOne<BaseProfileRow>();

    return row ?? null;
  }

  private async loadCountMap(
    tableName: string,
    profileColumn = 'user_profile_id',
  ): Promise<Map<string, number>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select(`t.${profileColumn}`, 'profileId')
      .addSelect('COUNT(1)', 'count')
      .from(tableName, 't')
      .groupBy(`t.${profileColumn}`)
      .getRawMany<{ profileId: string; count: string }>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.profileId, Number(row.count) || 0);
    }
    return map;
  }

  private async loadCountByProfile(
    tableName: string,
    profileId: string,
    profileColumn = 'user_profile_id',
  ): Promise<number> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from(tableName, 't')
      .where(`t.${profileColumn} = :profileId`, { profileId })
      .getRawOne<{ count: string }>();

    return Number(row?.count ?? 0);
  }

  private async loadStringArrayMap(
    tableName: string,
    valueColumn: string,
  ): Promise<Map<string, string[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('t.user_profile_id', 'profileId')
      .addSelect(`GROUP_CONCAT(t.${valueColumn})`, 'values')
      .from(tableName, 't')
      .groupBy('t.user_profile_id')
      .getRawMany<{ profileId: string; values: string | null }>();

    const map = new Map<string, string[]>();
    for (const row of rows) {
      if (!row.values) {
        map.set(row.profileId, []);
        continue;
      }
      map.set(
        row.profileId,
        row.values
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      );
    }
    return map;
  }

  private async loadStringArrayByProfile(
    tableName: string,
    valueColumn: string,
    profileId: string,
  ): Promise<string[]> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select(`GROUP_CONCAT(t.${valueColumn})`, 'values')
      .from(tableName, 't')
      .where('t.user_profile_id = :profileId', { profileId })
      .getRawOne<{ values: string | null }>();

    if (!row?.values) return [];
    return row.values
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private async loadIntArrayMap(
    tableName: string,
    valueColumn: string,
  ): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('t.user_profile_id', 'profileId')
      .addSelect(`GROUP_CONCAT(t.${valueColumn})`, 'values')
      .from(tableName, 't')
      .groupBy('t.user_profile_id')
      .getRawMany<{ profileId: string; values: string | null }>();

    const map = new Map<string, number[]>();
    for (const row of rows) {
      if (!row.values) {
        map.set(row.profileId, []);
        continue;
      }
      map.set(
        row.profileId,
        row.values
          .split(',')
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value)),
      );
    }
    return map;
  }

  private async loadIntArrayByProfile(
    tableName: string,
    valueColumn: string,
    profileId: string,
  ): Promise<number[]> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select(`GROUP_CONCAT(t.${valueColumn})`, 'values')
      .from(tableName, 't')
      .where('t.user_profile_id = :profileId', { profileId })
      .getRawOne<{ values: string | null }>();

    if (!row?.values) return [];
    return row.values
      .split(',')
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  }

  private async loadRecruitableGameCountMap(): Promise<Map<string, number>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('COUNT(1)', 'count')
      .from('player_games', 'g')
      .where('g.isRecruitable = :isRecruitable', { isRecruitable: true })
      .groupBy('g.profile_id')
      .getRawMany<{ profileId: string; count: string }>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.profileId, Number(row.count) || 0);
    }
    return map;
  }

  private async loadRecruitableGameCountByProfile(
    profileId: string,
  ): Promise<number> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from('player_games', 'g')
      .where('g.profile_id = :profileId', { profileId })
      .andWhere('g.isRecruitable = :isRecruitable', { isRecruitable: true })
      .getRawOne<{ count: string }>();

    return Number(row?.count ?? 0);
  }

  private async loadGameIdsMap(): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('g.rsc_game_id', 'gameId')
      .from('player_games', 'g')
      .getRawMany<{ profileId: string; gameId: number }>();

    const map = new Map<string, Set<number>>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      if (!Number.isFinite(gameId)) continue;
      this.pushIntMap(map, row.profileId, gameId);
    }
    return this.finalizeIntMap(map);
  }

  private async loadGameIdsByProfile(profileId: string): Promise<number[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.rsc_game_id', 'gameId')
      .from('player_games', 'g')
      .where('g.profile_id = :profileId', { profileId })
      .getRawMany<{ gameId: number }>();

    return [
      ...new Set(
        rows
          .map((row) => Number(row.gameId))
          .filter((value) => Number.isFinite(value)),
      ),
    ];
  }

  private async loadRecruitableGameIdsMap(): Promise<Map<string, number[]>> {
    return this.loadGameIdsMapByRecruitable(true);
  }

  private async loadNonRecruitableGameIdsMap(): Promise<Map<string, number[]>> {
    return this.loadGameIdsMapByRecruitable(false);
  }

  private async loadRecruitableGameIdsByProfile(
    profileId: string,
  ): Promise<number[]> {
    return this.loadGameIdsByProfileAndRecruitable(profileId, true);
  }

  private async loadNonRecruitableGameIdsByProfile(
    profileId: string,
  ): Promise<number[]> {
    return this.loadGameIdsByProfileAndRecruitable(profileId, false);
  }

  private async loadGameIdsMapByRecruitable(
    isRecruitable: boolean,
  ): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('g.rsc_game_id', 'gameId')
      .from('player_games', 'g')
      .where('g.isRecruitable = :isRecruitable', { isRecruitable })
      .getRawMany<{ profileId: string; gameId: number }>();

    const map = new Map<string, Set<number>>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      if (!Number.isFinite(gameId)) continue;
      this.pushIntMap(map, row.profileId, gameId);
    }
    return this.finalizeIntMap(map);
  }

  private async loadGameIdsByProfileAndRecruitable(
    profileId: string,
    isRecruitable: boolean,
  ): Promise<number[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.rsc_game_id', 'gameId')
      .from('player_games', 'g')
      .where('g.profile_id = :profileId', { profileId })
      .andWhere('g.isRecruitable = :isRecruitable', { isRecruitable })
      .getRawMany<{ gameId: number }>();

    return [
      ...new Set(
        rows
          .map((row) => Number(row.gameId))
          .filter((value) => Number.isFinite(value)),
      ),
    ];
  }

  private async loadGameRelationKeysMap(
    tableName: string,
    valueColumn: string,
  ): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('g.rsc_game_id', 'gameId')
      .addSelect(`t.${valueColumn}`, 'valueId')
      .from(tableName, 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .getRawMany<{ profileId: string; gameId: number; valueId: number }>();

    const map = new Map<string, Set<number>>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const valueId = Number(row.valueId);
      if (!Number.isFinite(gameId) || !Number.isFinite(valueId)) continue;
      this.pushIntMap(map, row.profileId, buildPlayerGameKey(gameId, valueId));
    }
    return this.finalizeIntMap(map);
  }

  private async loadGameRelationKeysByProfile(
    tableName: string,
    valueColumn: string,
    profileId: string,
  ): Promise<number[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.rsc_game_id', 'gameId')
      .addSelect(`t.${valueColumn}`, 'valueId')
      .from(tableName, 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .where('g.profile_id = :profileId', { profileId })
      .getRawMany<{ gameId: number; valueId: number }>();

    const values = new Set<number>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const valueId = Number(row.valueId);
      if (!Number.isFinite(gameId) || !Number.isFinite(valueId)) continue;
      values.add(buildPlayerGameKey(gameId, valueId));
    }
    return [...values];
  }

  private async loadGameModeKeysMap(): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('g.rsc_game_id', 'gameId')
      .addSelect('m.mode_id', 'modeId')
      .from('player_game_mode_ranks', 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .innerJoin('rsc_game_modes', 'm', 'm.id = t.rsc_game_mode_id')
      .getRawMany<{ profileId: string; gameId: number; modeId: number }>();

    const map = new Map<string, Set<number>>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const modeId = Number(row.modeId);
      if (!Number.isFinite(gameId) || !Number.isFinite(modeId)) continue;
      this.pushIntMap(map, row.profileId, buildPlayerGameKey(gameId, modeId));
    }
    return this.finalizeIntMap(map);
  }

  private async loadGameModeKeysByProfile(
    profileId: string,
  ): Promise<number[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.rsc_game_id', 'gameId')
      .addSelect('m.mode_id', 'modeId')
      .from('player_game_mode_ranks', 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .innerJoin('rsc_game_modes', 'm', 'm.id = t.rsc_game_mode_id')
      .where('g.profile_id = :profileId', { profileId })
      .getRawMany<{ gameId: number; modeId: number }>();

    const values = new Set<number>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const modeId = Number(row.modeId);
      if (!Number.isFinite(gameId) || !Number.isFinite(modeId)) continue;
      values.add(buildPlayerGameKey(gameId, modeId));
    }
    return [...values];
  }

  private async loadGameRankOrderKeysMap(): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('g.rsc_game_id', 'gameId')
      .addSelect('r.order_index', 'rankOrder')
      .from('player_game_mode_ranks', 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .innerJoin('rsc_game_ranks', 'r', 'r.id = t.rsc_game_rank_id')
      .getRawMany<{ profileId: string; gameId: number; rankOrder: number }>();

    const map = new Map<string, Set<number>>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const rankOrder = Number(row.rankOrder);
      if (!Number.isFinite(gameId) || !Number.isFinite(rankOrder)) continue;
      this.pushIntMap(
        map,
        row.profileId,
        buildPlayerGameKey(gameId, rankOrder),
      );
    }
    return this.finalizeIntMap(map);
  }

  private async loadGameRankOrderKeysByProfile(
    profileId: string,
  ): Promise<number[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.rsc_game_id', 'gameId')
      .addSelect('r.order_index', 'rankOrder')
      .from('player_game_mode_ranks', 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .innerJoin('rsc_game_ranks', 'r', 'r.id = t.rsc_game_rank_id')
      .where('g.profile_id = :profileId', { profileId })
      .getRawMany<{ gameId: number; rankOrder: number }>();

    const values = new Set<number>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const rankOrder = Number(row.rankOrder);
      if (!Number.isFinite(gameId) || !Number.isFinite(rankOrder)) continue;
      values.add(buildPlayerGameKey(gameId, rankOrder));
    }
    return [...values];
  }

  private async loadGameEloKeysMap(): Promise<Map<string, number[]>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.profile_id', 'profileId')
      .addSelect('g.rsc_game_id', 'gameId')
      .addSelect('t.elo', 'elo')
      .from('player_game_mode_ranks', 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .where('t.elo IS NOT NULL')
      .getRawMany<{ profileId: string; gameId: number; elo: number }>();

    const map = new Map<string, Set<number>>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const elo = Number(row.elo);
      if (!Number.isFinite(gameId) || !Number.isFinite(elo)) continue;
      this.pushIntMap(map, row.profileId, buildPlayerGameEloKey(gameId, elo));
    }
    return this.finalizeIntMap(map);
  }

  private async loadGameEloKeysByProfile(profileId: string): Promise<number[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('g.rsc_game_id', 'gameId')
      .addSelect('t.elo', 'elo')
      .from('player_game_mode_ranks', 't')
      .innerJoin('player_games', 'g', 'g.id = t.player_game_id')
      .where('g.profile_id = :profileId', { profileId })
      .andWhere('t.elo IS NOT NULL')
      .getRawMany<{ gameId: number; elo: number }>();

    const values = new Set<number>();
    for (const row of rows) {
      const gameId = Number(row.gameId);
      const elo = Number(row.elo);
      if (!Number.isFinite(gameId) || !Number.isFinite(elo)) continue;
      values.add(buildPlayerGameEloKey(gameId, elo));
    }
    return [...values];
  }

  private async loadProfileReportStatsMap(): Promise<
    Map<string, { unresolvedCount: number; resolvedCount: number }>
  > {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('r.reported_user_profile_id', 'profileId')
      .addSelect(
        `SUM(CASE WHEN r.status IN ('PENDING', 'IN_REVIEW') THEN 1 ELSE 0 END)`,
        'unresolvedCount',
      )
      .addSelect(
        `SUM(CASE WHEN r.status = 'RESOLVED' THEN 1 ELSE 0 END)`,
        'resolvedCount',
      )
      .from('profile_reports', 'r')
      .where('r.target_type = :targetType', { targetType: 'user' })
      .andWhere('r.reported_user_profile_id IS NOT NULL')
      .groupBy('r.reported_user_profile_id')
      .getRawMany<{
        profileId: string;
        unresolvedCount: string | number | null;
        resolvedCount: string | number | null;
      }>();

    const map = new Map<
      string,
      { unresolvedCount: number; resolvedCount: number }
    >();

    for (const row of rows) {
      const profileId = String(row.profileId ?? '').trim();
      if (!profileId) continue;
      map.set(profileId, {
        unresolvedCount: this.toSafeCount(row.unresolvedCount),
        resolvedCount: this.toSafeCount(row.resolvedCount),
      });
    }

    return map;
  }

  private async loadProfileReportStatsByProfile(
    profileId: string,
  ): Promise<{ unresolvedCount: number; resolvedCount: number }> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select(
        `SUM(CASE WHEN r.status IN ('PENDING', 'IN_REVIEW') THEN 1 ELSE 0 END)`,
        'unresolvedCount',
      )
      .addSelect(
        `SUM(CASE WHEN r.status = 'RESOLVED' THEN 1 ELSE 0 END)`,
        'resolvedCount',
      )
      .from('profile_reports', 'r')
      .where('r.target_type = :targetType', { targetType: 'user' })
      .andWhere('r.reported_user_profile_id = :profileId', { profileId })
      .getRawOne<{
        unresolvedCount: string | number | null;
        resolvedCount: string | number | null;
      }>();

    return {
      unresolvedCount: this.toSafeCount(row?.unresolvedCount),
      resolvedCount: this.toSafeCount(row?.resolvedCount),
    };
  }

  private async loadVerifiedBadgeId(): Promise<number | null> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('badge.id', 'id')
      .from('rsc_profile_badges', 'badge')
      .where('badge.key = :key', { key: 'verified' })
      .andWhere('badge.is_active = :active', { active: true })
      .limit(1)
      .getRawOne<{ id?: string | number }>();

    const value = Number(row?.id);
    return Number.isFinite(value) ? value : null;
  }

  private toSafeCount(value: string | number | null | undefined): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.trunc(parsed));
  }

  private pushIntMap(
    map: Map<string, Set<number>>,
    profileId: string,
    value: number,
  ): void {
    if (!profileId || !Number.isFinite(value)) return;
    const existing = map.get(profileId);
    if (existing) {
      existing.add(value);
    } else {
      map.set(profileId, new Set([value]));
    }
  }

  private finalizeIntMap(map: Map<string, Set<number>>): Map<string, number[]> {
    const output = new Map<string, number[]>();
    for (const [profileId, values] of map.entries()) {
      output.set(profileId, [...values]);
    }
    return output;
  }

  private buildDocument(
    profile: BaseProfileRow,
    aggregates: {
      languageIds: string[];
      badgeIds: number[];
      experienceCount: number;
      educationCount: number;
      professionalExperienceCount: number;
      socialLinksCount: number;
      hasRecruitableGame: boolean;
      gameIds: number[];
      recruitableGameIds: number[];
      nonRecruitableGameIds: number[];
      gamePositionKeys: number[];
      gamePlatformKeys: number[];
      gameCharacterKeys: number[];
      gameModeKeys: number[];
      gameRankOrderKeys: number[];
      gameEloKeys: number[];
      unresolvedReportsCount: number;
      resolvedNegativeReportsCount: number;
      hasVerifiedBadge: boolean;
    },
  ): PlayerSearchDocument {
    const birthDate =
      profile.birthDate instanceof Date
        ? profile.birthDate
        : new Date(profile.birthDate);
    const createdAt =
      profile.createdAt instanceof Date
        ? profile.createdAt
        : new Date(profile.createdAt);
    const lastLoginAt = this.toNullableDate(profile.lastLoginAt);
    const birthDateValue = Number.isNaN(birthDate.getTime())
      ? 0
      : birthDate.getTime();
    const createdAtValue = Number.isNaN(createdAt.getTime())
      ? 0
      : createdAt.getTime();
    const scores = this.playerScore.compute({
      profilePicture: profile.profilePicture,
      bannerPicture: profile.bannerPicture,
      description: profile.description,
      citation: profile.citation,
      nationalityId: profile.nationalityId,
      languageCount: aggregates.languageIds.length,
      experienceCount: aggregates.experienceCount,
      educationCount: aggregates.educationCount,
      professionalExperienceCount: aggregates.professionalExperienceCount,
      socialLinksCount: aggregates.socialLinksCount,
      badgesCount: aggregates.badgeIds.length,
      hasVerifiedBadge: aggregates.hasVerifiedBadge,
      isEmailVerified: this.toBoolean(profile.isEmailVerified),
      accountStatus: profile.accountStatus ?? null,
      createdAt: Number.isNaN(createdAt.getTime()) ? null : createdAt,
      lastLoginAt,
      unresolvedReportsCount: aggregates.unresolvedReportsCount,
      resolvedNegativeReportsCount: aggregates.resolvedNegativeReportsCount,
    });

    const doc: PlayerSearchDocument = {
      id: profile.id,
      username: profile.username,
      slug: profile.slug,
      hasProfilePicture: Boolean(profile.profilePicture),
      hasBannerPicture: Boolean(profile.bannerPicture),
      birthDate: birthDateValue,
      hasGame: aggregates.gameIds.length > 0,
      hasRecruitableGame: aggregates.hasRecruitableGame,
      experienceCount: aggregates.experienceCount,
      educationCount: aggregates.educationCount,
      professionalExperienceCount: aggregates.professionalExperienceCount,
      socialLinksCount: aggregates.socialLinksCount,
      badgesCount: aggregates.badgeIds.length,
      completenessScore: scores.completenessScore,
      trustScore: scores.trustScore,
      profileScore: scores.profileScore,
      createdAt: createdAtValue,
    };

    if (profile.description) doc.description = profile.description;
    if (profile.citation) doc.citation = profile.citation;
    if (profile.nationalityId) doc.nationalityId = profile.nationalityId;
    if (aggregates.languageIds.length) doc.languageIds = aggregates.languageIds;
    if (aggregates.badgeIds.length) doc.badgeIds = aggregates.badgeIds;
    if (profile.profilePicture) doc.profilePicture = profile.profilePicture;
    if (profile.bannerPicture) doc.bannerPicture = profile.bannerPicture;
    if (aggregates.gameIds.length) doc.gameIds = aggregates.gameIds;
    if (aggregates.recruitableGameIds.length)
      doc.recruitableGameIds = aggregates.recruitableGameIds;
    if (aggregates.nonRecruitableGameIds.length)
      doc.nonRecruitableGameIds = aggregates.nonRecruitableGameIds;
    if (aggregates.gamePositionKeys.length)
      doc.gamePositionKeys = aggregates.gamePositionKeys;
    if (aggregates.gamePlatformKeys.length)
      doc.gamePlatformKeys = aggregates.gamePlatformKeys;
    if (aggregates.gameCharacterKeys.length)
      doc.gameCharacterKeys = aggregates.gameCharacterKeys;
    if (aggregates.gameModeKeys.length)
      doc.gameModeKeys = aggregates.gameModeKeys;
    if (aggregates.gameRankOrderKeys.length)
      doc.gameRankOrderKeys = aggregates.gameRankOrderKeys;
    if (aggregates.gameEloKeys.length) doc.gameEloKeys = aggregates.gameEloKeys;

    return doc;
  }

  private toBoolean(value: boolean | number | string | null): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true';
    }
    return false;
  }

  private toNullableDate(value: Date | string | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async importDocuments(
    documents: PlayerSearchDocument[],
  ): Promise<void> {
    if (!documents.length) return;

    const batchSize = 200;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const response = await this.typesense.client
        .collections(PLAYER_SEARCH_COLLECTION)
        .documents()
        .import(batch, {
          action: 'upsert',
        });

      const lines = this.parseImportResponse(response);
      const failedLines = lines.filter((line) => line.success === false);
      if (!failedLines.length) continue;

      const firstError =
        failedLines[0]?.error ?? 'Unknown Typesense import error';
      throw new Error(
        `Typesense import failed for ${failedLines.length}/${lines.length} documents. First error: ${firstError}`,
      );
    }
  }

  private async isCollectionOutOfSync(): Promise<boolean> {
    const [dbCount, collection] = await Promise.all([
      this.profilesRepo.count(),
      this.typesense.client.collections(PLAYER_SEARCH_COLLECTION).retrieve(),
    ]);

    const indexedCount = Number(collection.num_documents ?? 0);
    if (!Number.isFinite(indexedCount)) return true;

    if (indexedCount !== dbCount) {
      this.logger.warn(
        `Typesense index count mismatch for "${PLAYER_SEARCH_COLLECTION}" (indexed=${indexedCount}, db=${dbCount}).`,
      );
      return true;
    }

    return false;
  }

  private parseImportResponse(
    response: unknown,
  ): Array<{ success: boolean; error?: string }> {
    if (Array.isArray(response)) {
      return response.filter(
        (item): item is { success: boolean; error?: string } => {
          return (
            typeof item === 'object' &&
            item !== null &&
            'success' in item &&
            typeof (item as { success?: unknown }).success === 'boolean'
          );
        },
      );
    }

    if (typeof response !== 'string') return [];

    return response
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          const parsed = JSON.parse(line) as {
            success: boolean;
            error?: string;
          };
          return parsed;
        } catch {
          return {
            success: false,
            error: `Unparseable Typesense import line: ${line}`,
          };
        }
      });
  }
}
