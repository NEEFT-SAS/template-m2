import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BillingLimitKey } from '@/contexts/billing/infra/entitlements/billing-entitlements.registry';

export const BILLING_CREDIT_BALANCE_REPOSITORY = Symbol('BILLING_CREDIT_BALANCE_REPOSITORY');

export type GetCreditBalanceInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string;
  creditKey: BillingLimitKey; // BOOSTS / NON_CONTACT_MESSAGES
};

export type AddCreditBalanceInput = GetCreditBalanceInput & {
  amount: number;
};

export type ConsumeCreditBalanceInput = GetCreditBalanceInput & {
  amount: number;
};

export interface BillingCreditBalanceRepositoryPort {
  getBalance(input: GetCreditBalanceInput): Promise<number>;

  addCredits(input: AddCreditBalanceInput): Promise<void>;

  consumeCredits(input: ConsumeCreditBalanceInput): Promise<boolean>;
}
