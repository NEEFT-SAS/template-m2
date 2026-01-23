import { Inject, Injectable } from '@nestjs/common';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BillingLimitKey } from '@/contexts/billing/infra/entitlements/billing-entitlements.registry';
import { BillingPlanKeyEnum } from '@/contexts/billing/infra/entitlements/billing-plans.registry';
import { BILLING_SUBJECT_REPOSITORY, BillingSubjectRepositoryPort } from '@/contexts/billing/app/ports/billing-subject.repository.port';
import { BILLING_USAGE_REPOSITORY, BillingUsageRepositoryPort } from '@/contexts/billing/app/ports/billing-usage.repository.port';
import { BillingEntitlementsResolver, getMonthKey } from '@/contexts/billing/infra/entitlements/billing-entitlements.resolver';
import { BILLING_CREDIT_BALANCE_REPOSITORY, BillingCreditBalanceRepositoryPort } from '../ports/billing-credit.repository.port';
import { BillingLimitExceededError } from '../../domain/errors/billing.errors';

export type ConsumeBillingLimitInput = { subjectType: BillingSubjectTypeEnum; subjectId: string; limitKey: BillingLimitKey; amount?: number };

@Injectable()
export class ConsumeBillingLimitUseCase {
  constructor(
    @Inject(BILLING_SUBJECT_REPOSITORY) private readonly billingSubjects: BillingSubjectRepositoryPort,
    @Inject(BILLING_USAGE_REPOSITORY) private readonly usageRepo: BillingUsageRepositoryPort,
    @Inject(BILLING_CREDIT_BALANCE_REPOSITORY) private readonly creditBalances: BillingCreditBalanceRepositoryPort,
    private readonly entitlementsResolver: BillingEntitlementsResolver,
  ) {}

  async execute(input: ConsumeBillingLimitInput): Promise<void> {
    const amount = input.amount ?? 1;
    if (amount <= 0) return;

    const planKey = (await this.billingSubjects.findActivePlanKey({ subjectType: input.subjectType, subjectId: input.subjectId })) ?? BillingPlanKeyEnum.FREE;
    const ent = this.entitlementsResolver.resolve({ subjectType: input.subjectType, planKey });
    const baseLimit = ent.monthlyLimits[input.limitKey];

    if (baseLimit === 'unlimited') return;

    const baseLimitNumber = Number(baseLimit) || 0;
    const monthKey = getMonthKey();

    if (baseLimitNumber > 0) {
      const okBase = await this.usageRepo.tryConsumeMonthlyUsage({ subjectType: input.subjectType, subjectId: input.subjectId, limitKey: input.limitKey, monthKey, baseLimit: baseLimitNumber, amount });
      if (okBase) return;
    }

    const okWallet = await this.creditBalances.consumeCredits({ subjectType: input.subjectType, subjectId: input.subjectId, creditKey: input.limitKey, amount });
    if (!okWallet) throw new BillingLimitExceededError(input.limitKey);
  }
}
