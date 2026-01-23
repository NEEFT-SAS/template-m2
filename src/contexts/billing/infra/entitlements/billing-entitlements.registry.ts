/***************************
 * Billing entitlements registry
 *
 * Source de vérité "backend" des avantages par plan.
 * Pas besoin DB pour ça.
 * Ultimate = Pro + bonus.
 ***************************/

import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BillingPlanKeyEnum } from './billing-plans.registry';

export type BillingEntitlements = {
  features: Record<string, boolean>;
  limits: Record<string, number | null>; // null = illimité
  monthlyCredits: Record<string, number>; // crédits ajoutés chaque mois (optionnel)
};

/***************************
 * BillingEntitlementsRegistry
 *
 * Source de vérité: contenu des plans (features + quotas)
 ***************************/


export type BillingPlanEntitlementsKey = `${BillingSubjectTypeEnum}_${BillingPlanKeyEnum}`;

export const BillingLimitKeys = {
  NON_CONTACT_MESSAGES: 'NON_CONTACT_MESSAGES',
  BOOSTS: 'BOOSTS',
} as const;

export type BillingLimitKey = (typeof BillingLimitKeys)[keyof typeof BillingLimitKeys];


export const BillingFeatureKeys = {
  ADVANCED_FILTERS: 'ADVANCED_FILTERS',
  SEE_PROFILE_VISITORS: 'SEE_PROFILE_VISITORS',
  PRIORITY_SEARCH: 'PRIORITY_SEARCH',
} as const;

export type BillingFeatureKey = (typeof BillingFeatureKeys)[keyof typeof BillingFeatureKeys];

export type BillingLimitValue = number | 'unlimited';

export type BillingEntitlementsDefinition = {
  features: Record<BillingFeatureKey, boolean>;
  monthlyLimits: Record<BillingLimitKey, BillingLimitValue>;
};

export const BILLING_ENTITLEMENTS: Record<BillingPlanEntitlementsKey, BillingEntitlementsDefinition> = {
  /** PLAYER */
  [`${BillingSubjectTypeEnum.PLAYER}_${BillingPlanKeyEnum.FREE}`]: {
    features: {
      [BillingFeatureKeys.ADVANCED_FILTERS]: false,
      [BillingFeatureKeys.SEE_PROFILE_VISITORS]: false,
      [BillingFeatureKeys.PRIORITY_SEARCH]: false,
    },
    monthlyLimits: {
      [BillingLimitKeys.NON_CONTACT_MESSAGES]: 0,
      [BillingLimitKeys.BOOSTS]: 0,
    },
  },

  [`${BillingSubjectTypeEnum.PLAYER}_${BillingPlanKeyEnum.PRO}`]: {
    features: {
      [BillingFeatureKeys.ADVANCED_FILTERS]: true,
      [BillingFeatureKeys.SEE_PROFILE_VISITORS]: true,
      [BillingFeatureKeys.PRIORITY_SEARCH]: false,
    },
    monthlyLimits: {
      [BillingLimitKeys.NON_CONTACT_MESSAGES]: 10,
      [BillingLimitKeys.BOOSTS]: 1,
    },
  },

  [`${BillingSubjectTypeEnum.PLAYER}_${BillingPlanKeyEnum.ULTIMATE}`]: {
    features: {
      [BillingFeatureKeys.ADVANCED_FILTERS]: true,
      [BillingFeatureKeys.SEE_PROFILE_VISITORS]: true,
      [BillingFeatureKeys.PRIORITY_SEARCH]: true,
    },
    monthlyLimits: {
      [BillingLimitKeys.NON_CONTACT_MESSAGES]: 'unlimited',
      [BillingLimitKeys.BOOSTS]: 3,
    },
  },

  /** TEAM */
  [`${BillingSubjectTypeEnum.TEAM}_${BillingPlanKeyEnum.FREE}`]: {
    features: {
      [BillingFeatureKeys.ADVANCED_FILTERS]: false,
      [BillingFeatureKeys.SEE_PROFILE_VISITORS]: false,
      [BillingFeatureKeys.PRIORITY_SEARCH]: false,
    },
    monthlyLimits: {
      [BillingLimitKeys.NON_CONTACT_MESSAGES]: 0,
      [BillingLimitKeys.BOOSTS]: 0,
    },
  },

  [`${BillingSubjectTypeEnum.TEAM}_${BillingPlanKeyEnum.PRO}`]: {
    features: {
      [BillingFeatureKeys.ADVANCED_FILTERS]: true,
      [BillingFeatureKeys.SEE_PROFILE_VISITORS]: true,
      [BillingFeatureKeys.PRIORITY_SEARCH]: false,
    },
    monthlyLimits: {
      [BillingLimitKeys.NON_CONTACT_MESSAGES]: 20,
      [BillingLimitKeys.BOOSTS]: 2,
    },
  },

  [`${BillingSubjectTypeEnum.TEAM}_${BillingPlanKeyEnum.ULTIMATE}`]: {
    features: {
      [BillingFeatureKeys.ADVANCED_FILTERS]: true,
      [BillingFeatureKeys.SEE_PROFILE_VISITORS]: true,
      [BillingFeatureKeys.PRIORITY_SEARCH]: true,
    },
    monthlyLimits: {
      [BillingLimitKeys.NON_CONTACT_MESSAGES]: 'unlimited',
      [BillingLimitKeys.BOOSTS]: 5,
    },
  },
};
