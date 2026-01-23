/***************************
 * One-shot packs registry
 ***************************/

import { BillingSubjectTypeEnum } from '@neeft-sas/shared';

export enum BillingPackKeyEnum {
  PLAYER_BOOST_PACK_3 = 'player_boost_pack_3',
  PLAYER_MESSAGES_PACK_10 = 'player_messages_pack_10',
}

export type BillingPackDefinition = {
  subjectType: BillingSubjectTypeEnum;
  packKey: BillingPackKeyEnum;
  lookupKey: string;
  creditKey: string;
  quantity: number;
};

export const BILLING_PACKS: BillingPackDefinition[] = [
  {
    subjectType: BillingSubjectTypeEnum.PLAYER,
    packKey: BillingPackKeyEnum.PLAYER_BOOST_PACK_3,
    lookupKey: BillingPackKeyEnum.PLAYER_BOOST_PACK_3,
    creditKey: 'BOOSTS',
    quantity: 3,
  },
  {
    subjectType: BillingSubjectTypeEnum.PLAYER,
    packKey: BillingPackKeyEnum.PLAYER_MESSAGES_PACK_10,
    lookupKey: BillingPackKeyEnum.PLAYER_MESSAGES_PACK_10,
    creditKey: 'NON_CONTACT_MESSAGES',
    quantity: 10,
  },
];
