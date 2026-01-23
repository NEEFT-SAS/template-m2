import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BillingLimitKey } from '../../infra/entitlements/billing-entitlements.registry';

export const BILLING_USAGE_REPOSITORY = Symbol('BILLING_USAGE_REPOSITORY');

export type GetMonthlyUsageInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string;
  limitKey: BillingLimitKey;
  monthKey: string; // YYYY-MM
};

export type TryConsumeMonthlyUsageInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string;
  limitKey: BillingLimitKey;
  monthKey: string; // YYYY-MM
  baseLimit: number; // ex: 10
  amount?: number; // par défaut 1
};

export interface BillingUsageRepositoryPort {
  getMonthlyUsage(input: GetMonthlyUsageInput): Promise<number>;
  tryConsumeMonthlyUsage(input: TryConsumeMonthlyUsageInput): Promise<boolean>;
}
