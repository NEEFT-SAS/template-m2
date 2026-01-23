import { DomainError } from "@/core/errors/domain-error";

export class BillingPlanNotFoundError extends DomainError {
  constructor(lookupKey: string) {
    super({
      code: 'BILLING_PLAN_NOT_FOUND',
      message: 'Billing plan not found',
      statusCode: 404,
      details: { lookupKey },
    });
  }
}

export class BillingStripePriceNotFoundError extends DomainError {
  constructor(lookupKey: string) {
    super({
      code: 'BILLING_STRIPE_PRICE_NOT_FOUND',
      message: 'Stripe price not found for billing plan',
      statusCode: 404,
      details: { lookupKey },
    });
  }
}

export class BillingInvalidRecurringPriceError extends DomainError {
  constructor(priceId: string, lookupKey: string) {
    super({
      code: 'BILLING_INVALID_RECURRING_PRICE',
      message: 'Price must be monthly recurring',
      statusCode: 400,
      details: { priceId, lookupKey },
    });
  }
}

export class BillingMissingClientSecretError extends DomainError {
  constructor(subscriptionId: string) {
    super({
      code: 'BILLING_MISSING_CLIENT_SECRET',
      message: 'Missing client secret for subscription',
      statusCode: 500,
      details: { subscriptionId },
    });
  }
}

export class BillingLimitExceededError extends DomainError {
  constructor(limitKey: string) {
    super({ code: 'BILLING_LIMIT_EXCEEDED', message: 'Billing limit exceeded', statusCode: 403, details: { limitKey } });
  }
}