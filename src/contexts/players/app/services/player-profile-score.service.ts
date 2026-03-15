import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerScoreService } from '@/contexts/search/app/services/player-score.service';

export type PlayerProfileScores = {
  completenessScore: number;
  trustScore: number;
  profileScore: number;
};

@Injectable()
export class PlayerProfileScoreService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly playerScore: PlayerScoreService,
  ) {}

  async computeForProfile(
    profile: UserProfileEntity,
  ): Promise<PlayerProfileScores> {
    const profileId = String(profile.id ?? '').trim();
    if (!profileId) {
      return { completenessScore: 0, trustScore: 0, profileScore: 0 };
    }

    const [
      accountRow,
      experienceCount,
      educationCount,
      professionalExperienceCount,
      socialLinksCount,
      badgesCount,
      hasVerifiedBadge,
      reportStats,
    ] = await Promise.all([
      this.loadAccountRow(profileId),
      this.countRows('user_experiences', 'user_profile_id', profileId),
      this.countRows(
        'user_profile_school_experiences',
        'profile_id',
        profileId,
      ),
      this.countRows(
        'user_profile_professional_experiences',
        'profile_id',
        profileId,
      ),
      this.countRows('user_social_links', 'user_profile_id', profileId),
      this.countRows('user_badges', 'user_profile_id', profileId),
      this.loadHasVerifiedBadge(profileId),
      this.loadReportStats(profileId),
    ]);

    const scores = this.playerScore.compute({
      profilePicture: profile.profilePicture ?? null,
      bannerPicture: profile.bannerPicture ?? null,
      description: profile.description ?? null,
      citation: profile.citation ?? null,
      nationalityId: profile.nationality?.id ?? null,
      languageCount: Array.isArray(profile.languages)
        ? profile.languages.length
        : 0,
      experienceCount,
      educationCount,
      professionalExperienceCount,
      socialLinksCount,
      badgesCount,
      hasVerifiedBadge,
      isEmailVerified: this.toBoolean(accountRow?.isEmailVerified ?? null),
      accountStatus: String(accountRow?.accountStatus ?? '').trim() || null,
      createdAt: this.toNullableDate(accountRow?.createdAt ?? null),
      lastLoginAt: this.toNullableDate(accountRow?.lastLoginAt ?? null),
      unresolvedReportsCount: reportStats.unresolvedCount,
      resolvedNegativeReportsCount: reportStats.resolvedCount,
    });

    return {
      completenessScore: scores.completenessScore,
      trustScore: scores.trustScore,
      profileScore: scores.profileScore,
    };
  }

  private async loadAccountRow(profileId: string): Promise<{
    isEmailVerified: boolean | number | string | null;
    accountStatus: string | null;
    lastLoginAt: Date | string | null;
    createdAt: Date | string | null;
  } | null> {
    return this.dataSource
      .createQueryBuilder()
      .select('credentials.is_email_verified', 'isEmailVerified')
      .addSelect('credentials.status', 'accountStatus')
      .addSelect('credentials.last_login_at', 'lastLoginAt')
      .addSelect('profile.created_at', 'createdAt')
      .from('user_profiles', 'profile')
      .innerJoin(
        'user_credentials',
        'credentials',
        'credentials.id = profile.user_credential_id',
      )
      .where('profile.id = :profileId', { profileId })
      .getRawOne<{
        isEmailVerified: boolean | number | string | null;
        accountStatus: string | null;
        lastLoginAt: Date | string | null;
        createdAt: Date | string | null;
      }>();
  }

  private async countRows(
    tableName: string,
    profileColumn: string,
    profileId: string,
  ): Promise<number> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from(tableName, 't')
      .where(`t.${profileColumn} = :profileId`, { profileId })
      .getRawOne<{ count?: string | number | null }>();

    return this.toSafeCount(row?.count);
  }

  private async loadHasVerifiedBadge(profileId: string): Promise<boolean> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('1', 'existsFlag')
      .from('user_badges', 'badgeAssignment')
      .innerJoin(
        'rsc_profile_badges',
        'badge',
        `
        badge.id = badgeAssignment.rsc_badge_id
        AND badge.key = :badgeKey
        AND badge.is_active = :isActive
        `,
        { badgeKey: 'verified', isActive: true },
      )
      .where('badgeAssignment.user_profile_id = :profileId', { profileId })
      .limit(1)
      .getRawOne<{ existsFlag?: string | number | null }>();

    return Boolean(row);
  }

  private async loadReportStats(
    profileId: string,
  ): Promise<{ unresolvedCount: number; resolvedCount: number }> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select(
        `SUM(CASE WHEN report.status IN ('PENDING', 'IN_REVIEW') THEN 1 ELSE 0 END)`,
        'unresolvedCount',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'RESOLVED' THEN 1 ELSE 0 END)`,
        'resolvedCount',
      )
      .from('profile_reports', 'report')
      .where('report.target_type = :targetType', { targetType: 'user' })
      .andWhere('report.reported_user_profile_id = :profileId', { profileId })
      .getRawOne<{
        unresolvedCount?: string | number | null;
        resolvedCount?: string | number | null;
      }>();

    return {
      unresolvedCount: this.toSafeCount(row?.unresolvedCount),
      resolvedCount: this.toSafeCount(row?.resolvedCount),
    };
  }

  private toSafeCount(value: string | number | null | undefined): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.trunc(parsed));
  }

  private toNullableDate(value: Date | string | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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
}
