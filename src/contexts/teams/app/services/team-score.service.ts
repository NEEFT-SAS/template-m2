import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserAccountAccessStatus } from '@neeft-sas/shared';
import { DataSource, Repository } from 'typeorm';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { TeamMemberEntity } from '../../infra/entities/team-member.entity';
import { TeamEntity } from '../../infra/entities/team.entity';

type TeamScoreSnapshot = {
  logoPicture: string | null;
  bannerPicture: string | null;
  description: string | null;
  quote: string | null;
  foundedAt: Date | null;
  city: string | null;
  countryId: string | null;
  languageCount: number;
  membersCount: number;
  rostersCount: number;
  activeRostersCount: number;
  activeStaffedRostersCount: number;
  lastActiveRosterUpdatedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  isVerified: boolean;
  ownerEmailVerified: boolean;
  ownerStatus: string | null;
  unresolvedReportsCount: number;
  resolvedNegativeReportsCount: number;
};

@Injectable()
export class TeamScoreService implements OnModuleInit {
  private readonly logger = new Logger(TeamScoreService.name);

  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepo: Repository<TeamMemberEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const updated = await this.recomputeAllTeams();
      if (updated > 0) {
        this.logger.log(`Team scores initialized for ${updated} teams.`);
      }
    } catch (error: any) {
      this.logger.error(
        `Team score initialization failed: ${error?.message ?? error}`,
      );
    }
  }

  async recomputeAllTeams(): Promise<number> {
    const rows = await this.teamRepo.find({ select: ['id'] });
    for (const row of rows) {
      await this.recomputeTeamScores(row.id);
    }
    return rows.length;
  }

  async recomputeTeamScores(teamId: string): Promise<{
    completenessScore: number;
    trustScore: number;
    profileScore: number;
  } | null> {
    const snapshot = await this.loadSnapshot(teamId);
    if (!snapshot) return null;

    const completenessScore = this.computeCompletenessScore(snapshot);
    const trustScore = this.computeTrustScore(snapshot);
    const profileScore = this.computeProfileScore(
      completenessScore,
      trustScore,
    );

    await this.teamRepo.update(
      { id: teamId },
      {
        completenessScore,
        trustScore,
      },
    );

    return { completenessScore, trustScore, profileScore };
  }

  computeProfileScore(completenessScore: number, trustScore: number): number {
    return this.clampScore(
      Math.round(completenessScore * 0.65 + trustScore * 0.35),
    );
  }

  private async loadSnapshot(
    teamId: string,
  ): Promise<TeamScoreSnapshot | null> {
    const teamRow = await this.teamRepo
      .createQueryBuilder('team')
      .leftJoin('team.country', 'country')
      .leftJoin('team.languages', 'language')
      .leftJoin('team.owner', 'owner')
      .leftJoin(
        UserCredentialsEntity,
        'ownerCredentials',
        'ownerCredentials.id = owner.userCredentialId',
      )
      .select('team.id', 'id')
      .addSelect('team.logoPicture', 'logoPicture')
      .addSelect('team.bannerPicture', 'bannerPicture')
      .addSelect('team.description', 'description')
      .addSelect('team.quote', 'quote')
      .addSelect('team.foundedAt', 'foundedAt')
      .addSelect('team.city', 'city')
      .addSelect('team.isVerified', 'isVerified')
      .addSelect('team.createdAt', 'createdAt')
      .addSelect('team.updatedAt', 'updatedAt')
      .addSelect('country.id', 'countryId')
      .addSelect('COUNT(DISTINCT language.id)', 'languageCount')
      .addSelect('ownerCredentials.isEmailVerified', 'ownerEmailVerified')
      .addSelect('ownerCredentials.status', 'ownerStatus')
      .where('team.id = :teamId', { teamId })
      .groupBy('team.id')
      .addGroupBy('country.id')
      .addGroupBy('ownerCredentials.isEmailVerified')
      .addGroupBy('ownerCredentials.status')
      .getRawOne<{
        logoPicture: string | null;
        bannerPicture: string | null;
        description: string | null;
        quote: string | null;
        foundedAt: Date | string | null;
        city: string | null;
        countryId: string | null;
        languageCount: string | number | null;
        createdAt: Date | string | null;
        updatedAt: Date | string | null;
        isVerified: boolean | number | string | null;
        ownerEmailVerified: boolean | number | string | null;
        ownerStatus: string | null;
      }>();

    if (!teamRow) return null;

    const membersCount = await this.teamMemberRepo.count({
      where: { team: { id: teamId } },
    });

    const rosterStats = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(1)', 'rostersCount')
      .addSelect(
        'SUM(CASE WHEN roster.is_active = 1 THEN 1 ELSE 0 END)',
        'activeRostersCount',
      )
      .addSelect(
        'MAX(CASE WHEN roster.is_active = 1 THEN roster.updated_at ELSE NULL END)',
        'lastActiveRosterUpdatedAt',
      )
      .from('team_rosters', 'roster')
      .where('roster.team_id = :teamId', { teamId })
      .getRawOne<{
        rostersCount: string | number | null;
        activeRostersCount: string | number | null;
        lastActiveRosterUpdatedAt: Date | string | null;
      }>();

    const activeStaffedRows = await this.dataSource
      .createQueryBuilder()
      .select('roster.id', 'rosterId')
      .addSelect('COUNT(member.id)', 'membersCount')
      .from('team_rosters', 'roster')
      .leftJoin('team_roster_members', 'member', 'member.roster_id = roster.id')
      .where('roster.team_id = :teamId', { teamId })
      .andWhere('roster.is_active = :isActive', { isActive: true })
      .groupBy('roster.id')
      .having('COUNT(member.id) >= :minimumMembers', { minimumMembers: 3 })
      .getRawMany<{ rosterId: string }>();

    const reportStats = await this.dataSource
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
      .where('report.target_type = :targetType', { targetType: 'team' })
      .andWhere('report.reported_team_id = :teamId', { teamId })
      .getRawOne<{
        unresolvedCount: string | number | null;
        resolvedCount: string | number | null;
      }>();

    return {
      logoPicture: teamRow.logoPicture ?? null,
      bannerPicture: teamRow.bannerPicture ?? null,
      description: teamRow.description ?? null,
      quote: teamRow.quote ?? null,
      foundedAt: this.toNullableDate(teamRow.foundedAt),
      city: teamRow.city ?? null,
      countryId: teamRow.countryId ?? null,
      languageCount: this.toSafeCount(teamRow.languageCount),
      membersCount: this.toSafeCount(membersCount),
      rostersCount: this.toSafeCount(rosterStats?.rostersCount),
      activeRostersCount: this.toSafeCount(rosterStats?.activeRostersCount),
      activeStaffedRostersCount: activeStaffedRows.length,
      lastActiveRosterUpdatedAt: this.toNullableDate(
        rosterStats?.lastActiveRosterUpdatedAt ?? null,
      ),
      createdAt: this.toNullableDate(teamRow.createdAt),
      updatedAt: this.toNullableDate(teamRow.updatedAt),
      isVerified: this.toBoolean(teamRow.isVerified),
      ownerEmailVerified: this.toBoolean(teamRow.ownerEmailVerified),
      ownerStatus: teamRow.ownerStatus ?? null,
      unresolvedReportsCount: this.toSafeCount(reportStats?.unresolvedCount),
      resolvedNegativeReportsCount: this.toSafeCount(
        reportStats?.resolvedCount,
      ),
    };
  }

  private computeCompletenessScore(input: TeamScoreSnapshot): number {
    let score = 0;

    if (input.logoPicture) score += 12;
    if (input.bannerPicture) score += 8;

    const descriptionLength = (input.description ?? '').trim().length;
    if (descriptionLength >= 80) score += 10;
    else if (descriptionLength >= 20) score += 5;

    if (input.quote) score += 3;
    if (input.foundedAt) score += 4;
    if (input.city) score += 3;
    if (input.countryId) score += 5;

    if (input.languageCount >= 1) score += 5;
    if (input.languageCount >= 2) score += 5;

    if (input.membersCount >= 1) score += 10;
    if (input.membersCount >= 3) score += 5;

    if (input.rostersCount >= 1) score += 10;
    if (input.activeRostersCount >= 1) score += 10;
    if (input.activeStaffedRostersCount >= 1) score += 10;

    return this.clampScore(score);
  }

  private computeTrustScore(input: TeamScoreSnapshot): number {
    let score = 50;

    const ownerStatus = String(input.ownerStatus ?? '')
      .trim()
      .toLowerCase();
    const ownerIsActive = ownerStatus === UserAccountAccessStatus.ACTIVE;
    const ownerIsSuspended = ownerStatus === UserAccountAccessStatus.SUSPENDED;

    if (input.isVerified) score += 25;
    if (input.ownerEmailVerified) score += 10;
    if (ownerIsActive) score += 10;

    const teamAgeDays = this.daysSince(input.createdAt);
    if (teamAgeDays !== null && teamAgeDays >= 30) score += 5;
    if (teamAgeDays !== null && teamAgeDays >= 180) score += 5;

    const lastActiveRosterUpdateAgeDays = this.daysSince(
      input.lastActiveRosterUpdatedAt,
    );
    if (
      lastActiveRosterUpdateAgeDays !== null &&
      lastActiveRosterUpdateAgeDays <= 60
    ) {
      score += 10;
    }

    const unresolvedCount = this.toSafeCount(input.unresolvedReportsCount);
    if (unresolvedCount === 0) {
      score += 5;
    } else if (unresolvedCount <= 2) {
      score -= 10;
    } else if (unresolvedCount <= 5) {
      score -= 20;
    } else {
      score -= 35;
    }

    score -=
      Math.min(this.toSafeCount(input.resolvedNegativeReportsCount), 2) * 15;

    if (ownerIsSuspended) score -= 30;
    if (input.activeRostersCount <= 0) score -= 15;

    const lastTeamUpdateAgeDays = this.daysSince(input.updatedAt);
    if (lastTeamUpdateAgeDays !== null && lastTeamUpdateAgeDays > 90) {
      score -= 10;
    }

    return this.clampScore(score);
  }

  private toNullableDate(value: Date | string | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toSafeCount(value: string | number | null | undefined): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.trunc(parsed));
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

  private daysSince(date: Date | null): number | null {
    if (!date || Number.isNaN(date.getTime())) return null;
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return 0;
    return Math.floor(diffMs / 86_400_000);
  }

  private clampScore(value: number): number {
    const rounded = Math.round(value);
    return Math.max(0, Math.min(100, rounded));
  }
}
