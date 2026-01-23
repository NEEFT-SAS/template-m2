/***************************
 * CreateSubscriptionPaymentIntentUseCase
 *
 * Crée une subscription Stripe "default_incomplete"
 * et renvoie un clientSecret pour confirmer côté front (3DS ok)
 *
 * + persiste stripeCustomerId sur le subject (player/team)
 ***************************/

import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '@/core/errors/domain-error';
import { STRIPE_PORT, StripePort } from '../ports/stripe.port';
import { BILLING_PLANS } from '../../infra/entitlements/billing-plans.registry';
import { BILLING_SUBJECT_REPOSITORY, BillingSubjectRepositoryPort } from '../ports/billing-subject.repository.port';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { BillingInvalidRecurringPriceError, BillingPlanNotFoundError } from '../../domain/errors/billing.errors';

export type CreateSubscriptionPaymentInput = {
  lookupKey: string;
  subjectType: BillingSubjectTypeEnum;
  subjectId: string | null;
  userCredentialId: string | null;
};

@Injectable()
export class CreateSubscriptionPaymentIntentUseCase {
  constructor(
    @Inject(STRIPE_PORT) private readonly stripe: StripePort,
    @Inject(BILLING_SUBJECT_REPOSITORY) private readonly subjects: BillingSubjectRepositoryPort,
  ) {}

  async execute(input: CreateSubscriptionPaymentInput): Promise<any> {
    if (!input.subjectId) {
      throw new DomainError({
        code: 'BILLING_SUBJECT_ID_REQUIRED',
        message: 'Subject id is required',
        statusCode: 400,
        details: { fields: { subjectId: ['required'] } },
      });
    }

    const plan = BILLING_PLANS.find((p) => p.lookupKey === input.lookupKey);
    if (!plan) {
      throw new BillingPlanNotFoundError(input.lookupKey);
    }

    const prices = await this.stripe.listPrices({
      type: 'recurring',
      lookupKeys: [input.lookupKey],
    });

    const price = prices?.[0];
    if (!price) {
      throw new BillingPlanNotFoundError(input.lookupKey);
    }

    if (!price.recurring || price.recurring.interval !== 'month') {
      throw new BillingInvalidRecurringPriceError(price.id, input.lookupKey);
    }

    // ------------------------
    // Customer persisted
    // ------------------------
    let stripeCustomerId = await this.subjects.findStripeCustomerId({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    });

    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer({
        metadata: {
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          userCredentialId: input.userCredentialId ?? '',
        },
      });

      stripeCustomerId = customer.id;

      await this.subjects.setStripeCustomerId({
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        stripeCustomerId,
      });
    }

    console.log('[Billing] stripeCustomerId resolved', stripeCustomerId);

    // ------------------------
    // Subscription + intent
    // ------------------------
    const sub = await this.stripe.createSubscription({
      customerId: stripeCustomerId,
      priceId: price.id,
      metadata: {
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        lookupKey: input.lookupKey,
      },
    });

    console.log('[Billing] subscription output', sub);

    /**
     * ✅ IMPORTANT:
     * sub.clientSecret peut être null ET être un cas normal.
     * On throw uniquement si Stripe dit "payment/setup" mais aucun secret.
     */
    if ((sub.intentType === 'payment' || sub.intentType === 'setup') && !sub.clientSecret) {
      throw new BillingInvalidRecurringPriceError(price.id, input.lookupKey);
    }

    return {
      subscriptionId: sub.id,
      intentType: sub.intentType,
      clientSecret: sub.clientSecret,
      invoiceId: sub.invoiceId,
      hostedInvoiceUrl: sub.hostedInvoiceUrl,
      amountDue: sub.amountDue,
      currency: sub.currency,
    };
  }

}
