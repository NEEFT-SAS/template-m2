import { BillingSubjectTypeEnum } from "@neeft-sas/shared";

export enum BillingPlanKeyEnum {
  FREE = 'FREE',
  PRO = 'PRO',
  ULTIMATE = 'ULTIMATE',
}

export type BillingPlanDefinition = {
  subjectType: BillingSubjectTypeEnum;
  planKey: BillingPlanKeyEnum;
  lookupKey: string;
};

export const BILLING_PLANS: BillingPlanDefinition[] = [
  { subjectType: BillingSubjectTypeEnum.PLAYER, planKey: BillingPlanKeyEnum.FREE, lookupKey: 'player_free_monthly' },
  { subjectType: BillingSubjectTypeEnum.PLAYER, planKey: BillingPlanKeyEnum.PRO, lookupKey: 'player_pro_monthly' },
  { subjectType: BillingSubjectTypeEnum.PLAYER, planKey: BillingPlanKeyEnum.ULTIMATE, lookupKey: 'player_ultimate_monthly' },

  { subjectType: BillingSubjectTypeEnum.TEAM, planKey: BillingPlanKeyEnum.FREE, lookupKey: 'team_free_monthly' },
  { subjectType: BillingSubjectTypeEnum.TEAM, planKey: BillingPlanKeyEnum.PRO, lookupKey: 'team_pro_monthly' },
  { subjectType: BillingSubjectTypeEnum.TEAM, planKey: BillingPlanKeyEnum.ULTIMATE, lookupKey: 'team_ultimate_monthly' },
];