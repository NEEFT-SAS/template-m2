/***************************
 * StripePort
 *
 * Port = interface stable entre ton app et Stripe.
 * L'impl (StripeService) peut changer sans casser les usecases.
 ***************************/

export const STRIPE_PORT = Symbol('STRIPE_PORT');

export type StripePriceRecord = {
  id: string;
  lookup_key: string | null;
  currency: string;
  unit_amount: number | null;
  type: 'one_time' | 'recurring';
  recurring: { interval: 'day' | 'week' | 'month' | 'year' } | null;
};

export type StripeCustomerRecord = {
  id: string;
};

export type ListPricesInput = {
  type: 'recurring' | 'one_time';
  lookupKeys?: string[];
};

export type CreateCustomerInput = {
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
};

export type CreateSubscriptionInput = {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
};

export type StripeSubscriptionIntentType = 'payment' | 'setup' | 'hosted_invoice' | 'none';

export type CreateSubscriptionOutput = {
  id: string;
  intentType: 'payment' | 'setup' | 'hosted_invoice' | 'none';
  clientSecret: string | null;

  invoiceId: string | null;
  hostedInvoiceUrl: string | null;

  amountDue: number | null;
  currency: string | null;

  paymentIntentId: string | null;
  setupIntentId: string | null;
};

export interface StripePort {
  createCustomer(input: CreateCustomerInput): Promise<StripeCustomerRecord>;
  listPrices(input: ListPricesInput): Promise<StripePriceRecord[]>;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput>;
}
