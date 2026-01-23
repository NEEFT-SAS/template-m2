/***************************
 * BillingSubjectRepositoryPort
 *
 * Reads/writes Stripe identifiers on billing subjects (player/team).
 * Avoids creating duplicate Stripe customers.
 ***************************/

import { BillingSubjectTypeEnum } from "@neeft-sas/shared";
import { BillingPlanKeyEnum } from "../../infra/entitlements/billing-plans.registry";

export const BILLING_SUBJECT_REPOSITORY = Symbol('BILLING_SUBJECT_REPOSITORY');

export type BillingSubjectRef = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string;
};

export type FindStripeCustomerIdInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string;
};

export type SetStripeCustomerIdInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string;
  stripeCustomerId: string;
};

export type SetActivePlanKeyInput = BillingSubjectRef & {
  planKey: BillingPlanKeyEnum;
};

export interface BillingSubjectRepositoryPort {
  findStripeCustomerId(input: FindStripeCustomerIdInput): Promise<string | null>;
  setStripeCustomerId(input: SetStripeCustomerIdInput): Promise<void>;

  findActivePlanKey(input: BillingSubjectRef): Promise<BillingPlanKeyEnum | null>;
  setActivePlanKey(input: SetActivePlanKeyInput): Promise<void>;
}
