import { BillingCatalogPresenter } from '@neeft-sas/shared';
import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { STRIPE_PORT, StripePort } from '../ports/stripe.port';
import { BILLING_PLANS } from '../../infra/entitlements/billing-plans.registry';
import { BILLING_PACKS } from '../../infra/entitlements/billing-packs.registry';


@Injectable()
export class ListBillingCatalogUseCase {
  constructor(
    @Inject(STRIPE_PORT) private readonly stripe: StripePort
  
  ) {}

  async execute(): Promise<BillingCatalogPresenter> {
    const planLookupKeys = BILLING_PLANS.map((p) => p.lookupKey);
    const packLookupKeys = BILLING_PACKS.map((p) => p.lookupKey);

    const [subscriptions, oneShots] = await Promise.all([
      this.stripe.listPrices({ type: 'recurring', lookupKeys: planLookupKeys }),
      this.stripe.listPrices({ type: 'one_time', lookupKeys: packLookupKeys }),
    ]);

    const payload: BillingCatalogPresenter = {
      version: new Date().toISOString(),
      subscriptions: subscriptions.map((p) => ({
        id: p.id,
        lookupKey: p.lookup_key,
        currency: p.currency,
        unitAmount: p.unit_amount,
        type: p.type,
        interval: p.recurring?.interval ?? null,
      })) as any,
      oneShots: oneShots.map((p) => ({
        id: p.id,
        lookupKey: p.lookup_key,
        currency: p.currency,
        unitAmount: p.unit_amount,
        type: p.type,
        interval: null,
      })) as any,
    };

    return plainToInstance(BillingCatalogPresenter, payload, { excludeExtraneousValues: true });
  }
}
