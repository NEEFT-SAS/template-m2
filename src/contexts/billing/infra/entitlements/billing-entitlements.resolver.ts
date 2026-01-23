import { Inject, Injectable } from '@nestjs/common';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';

import { BILLING_ENTITLEMENTS, BillingEntitlementsDefinition, BillingLimitKey, BillingLimitValue, BillingPlanEntitlementsKey } from './billing-entitlements.registry';

import { BillingPlanKeyEnum } from './billing-plans.registry';

import { BILLING_USAGE_REPOSITORY, BillingUsageRepositoryPort } from '@/contexts/billing/app/ports/billing-usage.repository.port';
import { BILLING_CREDIT_BALANCE_REPOSITORY, BillingCreditBalanceRepositoryPort } from '../../app/ports/billing-credit.repository.port';



export type BillingMonthlyBonus = Partial<Record<BillingLimitKey, number>>;

/**
 * Remaining only:
 * - number = restant total (base + wallet)
 * - null = illimité
 */
export type BillingRemainingOnlyLimits = Record<BillingLimitKey, number | null>;

export type BillingEntitlementsRemainingOnly = {
  features: BillingEntitlementsDefinition['features'];
  limits: BillingRemainingOnlyLimits;
};

export const getMonthKey = (date: Date = new Date()): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

@Injectable()
export class BillingEntitlementsResolver {
  constructor(
    @Inject(BILLING_USAGE_REPOSITORY) private readonly usageRepo: BillingUsageRepositoryPort,
    @Inject(BILLING_CREDIT_BALANCE_REPOSITORY) private readonly creditBalances: BillingCreditBalanceRepositoryPort,
  ) {}

  resolve(params: {
    subjectType: BillingSubjectTypeEnum;
    planKey: BillingPlanKeyEnum;
    monthlyBonus?: BillingMonthlyBonus;
  }): BillingEntitlementsDefinition {
    const key: BillingPlanEntitlementsKey = `${params.subjectType}_${params.planKey}`;
    const base = BILLING_ENTITLEMENTS[key];

    if (!base) {
      return {
        features: {} as any,
        monthlyLimits: {} as any,
      };
    }

    const bonus = params.monthlyBonus ?? {};
    const monthlyLimits = this.applyMonthlyBonus(base.monthlyLimits, bonus);

    return {
      features: base.features,
      monthlyLimits,
    };
  }

  async resolveRemainingOnly(params: {
    subjectType: BillingSubjectTypeEnum;
    subjectId: string;
    currentPlanKey: BillingPlanKeyEnum;
    monthlyBonus?: BillingMonthlyBonus;
  }): Promise<BillingEntitlementsRemainingOnly> {
    const ent = this.resolve({
      subjectType: params.subjectType,
      planKey: params.currentPlanKey,
      monthlyBonus: params.monthlyBonus,
    });

    const monthKey = getMonthKey();
    const limits = {} as BillingRemainingOnlyLimits;

    const limitKeys = Object.keys(ent.monthlyLimits) as BillingLimitKey[];

    for (const limitKey of limitKeys) {
      const baseLimit: BillingLimitValue = ent.monthlyLimits[limitKey];

      // illimité -> null côté API
      if (baseLimit === 'unlimited') {
        limits[limitKey] = null;
        continue;
      }

      // 1) restant base du mois
      const usedThisMonth = await this.usageRepo.getMonthlyUsage({
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        limitKey,
        monthKey,
      });

      const baseRemaining = Math.max(0, Number(baseLimit) - (usedThisMonth || 0));

      // 2) crédits achetés restants (wallet, non mensuel)
      const walletRemaining = await this.creditBalances.getBalance({
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        creditKey: limitKey,
      });

      // ✅ restant total = base + wallet (boosts achetés jamais perdus)
      limits[limitKey] = baseRemaining + walletRemaining;
    }

    return {
      features: ent.features,
      limits,
    };
  }

  private applyMonthlyBonus(
    baseLimits: BillingEntitlementsDefinition['monthlyLimits'],
    bonus: BillingMonthlyBonus,
  ): BillingEntitlementsDefinition['monthlyLimits'] {
    const result: Record<string, BillingLimitValue> = { ...baseLimits };

    for (const [limitKey, extra] of Object.entries(bonus)) {
      const key = limitKey as BillingLimitKey;
      const current = result[key];

      if (current === 'unlimited') {
        result[key] = 'unlimited';
        continue;
      }

      const add = typeof extra === 'number' ? extra : 0;
      result[key] = Math.max(0, (Number(current) || 0) + add);
    }

    return result as any;
  }
}
