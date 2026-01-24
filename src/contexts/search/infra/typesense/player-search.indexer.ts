import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TypesenseService } from './typesense.service';
import { PLAYER_SEARCH_COLLECTION, playerSearchSchema } from './player-search.schema';
import { PlayerSearchDocument } from './player-search.types';

type BaseProfileRow = {
  id: string;
  username: string;
  slug: string;
  description: string | null;
  citation: string | null;
  profilePicture: string | null;
  bannerPicture: string | null;
  nationalityId: string | null;
  createdAt: Date | string;
};

@Injectable()
export class PlayerSearchIndexer implements OnModuleInit {
  private readonly logger = new Logger(PlayerSearchIndexer.name);

  constructor(
    private readonly typesense: TypesenseService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UserProfileEntity) private readonly profilesRepo: Repository<UserProfileEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureCollection();
    } catch (err: any) {
      this.logger.error(`Typesense init failed: ${err?.message ?? err}`);
    }
  }

  async ensureCollection(): Promise<void> {
    try {
      await this.typesense.client.collections(PLAYER_SEARCH_COLLECTION).retrieve();
    } catch (err: any) {
      const status = err?.httpStatus ?? err?.status;
      if (status === 404) {
        await this.typesense.client.collections().create(playerSearchSchema);
        this.logger.log(`Typesense collection created: ${PLAYER_SEARCH_COLLECTION}`);
        return;
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

    const [languageMap, badgeMap, experienceMap, educationMap, professionalMap, socialLinksMap] = await Promise.all([
      this.loadStringArrayMap('user_profile_languages', 'language_id'),
      this.loadIntArrayMap('user_badges', 'rsc_badge_id'),
      this.loadCountMap('user_experiences'),
      this.loadCountMap('user_educations'),
      this.loadCountMap('user_professional_experiences'),
      this.loadCountMap('user_social_links'),
    ]);

    const documents = baseProfiles.map((profile) =>
      this.buildDocument(profile, {
        languageIds: languageMap.get(profile.id) ?? [],
        badgeIds: badgeMap.get(profile.id) ?? [],
        experienceCount: experienceMap.get(profile.id) ?? 0,
        educationCount: educationMap.get(profile.id) ?? 0,
        professionalExperienceCount: professionalMap.get(profile.id) ?? 0,
        socialLinksCount: socialLinksMap.get(profile.id) ?? 0,
      }),
    );

    await this.importDocuments(documents);
    return { indexed: documents.length };
  }

  async syncBySlug(slug: string): Promise<{ indexed: number }> {
    await this.ensureCollection();

    const base = await this.fetchBaseProfileBySlug(slug);
    if (!base) return { indexed: 0 };

    const [languageIds, badgeIds, experienceCount, educationCount, professionalExperienceCount, socialLinksCount] =
      await Promise.all([
        this.loadStringArrayByProfile('user_profile_languages', 'language_id', base.id),
        this.loadIntArrayByProfile('user_badges', 'rsc_badge_id', base.id),
        this.loadCountByProfile('user_experiences', base.id),
        this.loadCountByProfile('user_educations', base.id),
        this.loadCountByProfile('user_professional_experiences', base.id),
        this.loadCountByProfile('user_social_links', base.id),
      ]);

    const document = this.buildDocument(base, {
      languageIds,
      badgeIds,
      experienceCount,
      educationCount,
      professionalExperienceCount,
      socialLinksCount,
    });

    await this.importDocuments([document]);
    return { indexed: 1 };
  }

  private async fetchBaseProfiles(): Promise<BaseProfileRow[]> {
    return this.profilesRepo
      .createQueryBuilder('profile')
      .leftJoin('profile.nationality', 'nationality')
      .select('profile.id', 'id')
      .addSelect('profile.username', 'username')
      .addSelect('profile.slug', 'slug')
      .addSelect('profile.description', 'description')
      .addSelect('profile.citation', 'citation')
      .addSelect('profile.profilePicture', 'profilePicture')
      .addSelect('profile.bannerPicture', 'bannerPicture')
      .addSelect('profile.createdAt', 'createdAt')
      .addSelect('nationality.id', 'nationalityId')
      .getRawMany<BaseProfileRow>();
  }

  private async fetchBaseProfileBySlug(slug: string): Promise<BaseProfileRow | null> {
    const row = await this.profilesRepo
      .createQueryBuilder('profile')
      .leftJoin('profile.nationality', 'nationality')
      .select('profile.id', 'id')
      .addSelect('profile.username', 'username')
      .addSelect('profile.slug', 'slug')
      .addSelect('profile.description', 'description')
      .addSelect('profile.citation', 'citation')
      .addSelect('profile.profilePicture', 'profilePicture')
      .addSelect('profile.bannerPicture', 'bannerPicture')
      .addSelect('profile.createdAt', 'createdAt')
      .addSelect('nationality.id', 'nationalityId')
      .where('LOWER(profile.slug) = LOWER(:slug)', { slug })
      .getRawOne<BaseProfileRow>();

    return row ?? null;
  }

  private async loadCountMap(tableName: string): Promise<Map<string, number>> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('t.user_profile_id', 'profileId')
      .addSelect('COUNT(1)', 'count')
      .from(tableName, 't')
      .groupBy('t.user_profile_id')
      .getRawMany<{ profileId: string; count: string }>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.profileId, Number(row.count) || 0);
    }
    return map;
  }

  private async loadCountByProfile(tableName: string, profileId: string): Promise<number> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from(tableName, 't')
      .where('t.user_profile_id = :profileId', { profileId })
      .getRawOne<{ count: string }>();

    return Number(row?.count ?? 0);
  }

  private async loadStringArrayMap(tableName: string, valueColumn: string): Promise<Map<string, string[]>> {
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
        row.values.split(',').map((value) => value.trim()).filter(Boolean),
      );
    }
    return map;
  }

  private async loadStringArrayByProfile(tableName: string, valueColumn: string, profileId: string): Promise<string[]> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select(`GROUP_CONCAT(t.${valueColumn})`, 'values')
      .from(tableName, 't')
      .where('t.user_profile_id = :profileId', { profileId })
      .getRawOne<{ values: string | null }>();

    if (!row?.values) return [];
    return row.values.split(',').map((value) => value.trim()).filter(Boolean);
  }

  private async loadIntArrayMap(tableName: string, valueColumn: string): Promise<Map<string, number[]>> {
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

  private async loadIntArrayByProfile(tableName: string, valueColumn: string, profileId: string): Promise<number[]> {
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

  private buildDocument(
    profile: BaseProfileRow,
    aggregates: {
      languageIds: string[];
      badgeIds: number[];
      experienceCount: number;
      educationCount: number;
      professionalExperienceCount: number;
      socialLinksCount: number;
    },
  ): PlayerSearchDocument {
    const createdAt = profile.createdAt instanceof Date ? profile.createdAt : new Date(profile.createdAt);
    const profileScore = this.computeProfileScore({
      profilePicture: profile.profilePicture,
      bannerPicture: profile.bannerPicture,
      description: profile.description,
      citation: profile.citation,
      nationalityId: profile.nationalityId,
      languageIds: aggregates.languageIds,
      experienceCount: aggregates.experienceCount,
      educationCount: aggregates.educationCount,
      professionalExperienceCount: aggregates.professionalExperienceCount,
      socialLinksCount: aggregates.socialLinksCount,
      badgesCount: aggregates.badgeIds.length,
    });

    const doc: PlayerSearchDocument = {
      id: profile.id,
      username: profile.username,
      slug: profile.slug,
      hasProfilePicture: Boolean(profile.profilePicture),
      hasBannerPicture: Boolean(profile.bannerPicture),
      experienceCount: aggregates.experienceCount,
      educationCount: aggregates.educationCount,
      professionalExperienceCount: aggregates.professionalExperienceCount,
      socialLinksCount: aggregates.socialLinksCount,
      badgesCount: aggregates.badgeIds.length,
      profileScore,
      createdAt: createdAt.getTime(),
    };

    if (profile.description) doc.description = profile.description;
    if (profile.citation) doc.citation = profile.citation;
    if (profile.nationalityId) doc.nationalityId = profile.nationalityId;
    if (aggregates.languageIds.length) doc.languageIds = aggregates.languageIds;
    if (aggregates.badgeIds.length) doc.badgeIds = aggregates.badgeIds;
    if (profile.profilePicture) doc.profilePicture = profile.profilePicture;
    if (profile.bannerPicture) doc.bannerPicture = profile.bannerPicture;

    return doc;
  }

  private computeProfileScore(input: {
    profilePicture: string | null;
    bannerPicture: string | null;
    description: string | null;
    citation: string | null;
    nationalityId: string | null;
    languageIds: string[];
    experienceCount: number;
    educationCount: number;
    professionalExperienceCount: number;
    socialLinksCount: number;
    badgesCount: number;
  }): number {
    let score = 0;

    if (input.profilePicture) score += 15;
    if (input.bannerPicture) score += 5;

    const descriptionLength = (input.description ?? '').trim().length;
    if (descriptionLength >= 80) score += 10;
    else if (descriptionLength >= 20) score += 5;

    if (input.citation) score += 3;
    if (input.nationalityId) score += 5;

    const languageCount = input.languageIds.length;
    if (languageCount >= 1) score += 5;
    if (languageCount >= 2) score += 5;

    score += Math.min(input.experienceCount, 3) * 5;
    score += Math.min(input.professionalExperienceCount, 3) * 5;
    score += Math.min(input.educationCount, 2) * 3;
    score += Math.min(input.socialLinksCount, 5) * 2;
    score += Math.min(input.badgesCount, 5) * 2;

    return Math.min(score, 100);
  }

  private async importDocuments(documents: PlayerSearchDocument[]): Promise<void> {
    if (!documents.length) return;

    const batchSize = 200;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await this.typesense.client.collections(PLAYER_SEARCH_COLLECTION).documents().import(batch, {
        action: 'upsert',
      });
    }
  }
}
