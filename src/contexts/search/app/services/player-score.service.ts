import { Injectable } from '@nestjs/common';
import { UserAccountAccessStatus } from '@neeft-sas/shared';

export type PlayerScoreInput = {
  profilePicture: string | null;
  bannerPicture: string | null;
  description: string | null;
  citation: string | null;
  nationalityId: string | null;
  languageCount: number;
  experienceCount: number;
  educationCount: number;
  professionalExperienceCount: number;
  socialLinksCount: number;
  badgesCount: number;
  hasVerifiedBadge: boolean;
  isEmailVerified: boolean;
  accountStatus: string | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  unresolvedReportsCount: number;
  resolvedNegativeReportsCount: number;
};

export type PlayerScoreOutput = {
  completenessScore: number;
  trustScore: number;
  profileScore: number;
};

@Injectable()
export class PlayerScoreService {
  compute(input: PlayerScoreInput): PlayerScoreOutput {
    const completenessScore = this.computeCompletenessScore(input);
    const trustScore = this.computeTrustScore(input);

    return {
      completenessScore,
      trustScore,
      profileScore: this.computeProfileScore(completenessScore, trustScore),
    };
  }

  private computeCompletenessScore(input: PlayerScoreInput): number {
    let score = 0;

    if (input.profilePicture) score += 15;
    if (input.bannerPicture) score += 5;

    const descriptionLength = (input.description ?? '').trim().length;
    if (descriptionLength >= 80) score += 10;
    else if (descriptionLength >= 20) score += 5;

    if (input.citation) score += 3;
    if (input.nationalityId) score += 5;

    if (input.languageCount >= 1) score += 5;
    if (input.languageCount >= 2) score += 5;

    score += Math.min(this.toPositiveInt(input.experienceCount), 3) * 5;
    score +=
      Math.min(this.toPositiveInt(input.professionalExperienceCount), 3) * 5;
    score += Math.min(this.toPositiveInt(input.educationCount), 2) * 3;
    score += Math.min(this.toPositiveInt(input.socialLinksCount), 5) * 2;
    score += Math.min(this.toPositiveInt(input.badgesCount), 5) * 2;

    return this.clampScore(score);
  }

  private computeTrustScore(input: PlayerScoreInput): number {
    let score = 50;

    const normalizedStatus = String(input.accountStatus ?? '')
      .trim()
      .toLowerCase();
    const isActive = normalizedStatus === UserAccountAccessStatus.ACTIVE;
    const isSuspended = normalizedStatus === UserAccountAccessStatus.SUSPENDED;

    if (input.isEmailVerified) score += 20;
    if (isActive) score += 10;

    const accountAgeDays = this.daysSince(input.createdAt);
    if (accountAgeDays !== null && accountAgeDays >= 30) score += 10;
    if (accountAgeDays !== null && accountAgeDays >= 180) score += 10;

    const lastLoginAgeDays = this.daysSince(input.lastLoginAt);
    if (lastLoginAgeDays !== null && lastLoginAgeDays <= 30) score += 5;

    if (input.hasVerifiedBadge) score += 10;

    const unresolvedCount = this.toPositiveInt(input.unresolvedReportsCount);
    if (unresolvedCount === 0) {
      score += 5;
    } else if (unresolvedCount <= 2) {
      score -= 10;
    } else if (unresolvedCount <= 5) {
      score -= 20;
    } else {
      score -= 35;
    }

    const resolvedNegativeCount = this.toPositiveInt(
      input.resolvedNegativeReportsCount,
    );
    score -= Math.min(resolvedNegativeCount, 2) * 15;

    if (isSuspended) score -= 40;

    score -= this.computeInactivityMalus(lastLoginAgeDays);

    return this.clampScore(score);
  }

  private computeInactivityMalus(daysSinceLastLogin: number | null): number {
    if (daysSinceLastLogin === null) return 15;
    if (daysSinceLastLogin > 365) return 30;
    if (daysSinceLastLogin > 180) return 20;
    if (daysSinceLastLogin > 90) return 10;
    if (daysSinceLastLogin > 45) return 5;
    return 0;
  }

  private computeProfileScore(
    completenessScore: number,
    trustScore: number,
  ): number {
    return this.clampScore(
      Math.round(completenessScore * 0.65 + trustScore * 0.35),
    );
  }

  private toPositiveInt(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.trunc(value));
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
