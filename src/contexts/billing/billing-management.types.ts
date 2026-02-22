export type StripeProductMetadata = Record<string, string>;

export type StripeOffer = {
  id: string;
  productId: string;
  priceId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  intervalCount: number | null;
  features: string[];
  images: string[];
  popular: boolean;
  active: boolean;
  metadata: StripeProductMetadata;
};

export type StripeBillingSubscription = {
  id: string;
  stripeSubscriptionId: string;
  status: 'active' | 'expired' | 'canceled' | 'unpaid';
  startedAt: Date;
  expiredAt: Date;
  trialEndAt: Date | null;
  canceledAt: Date | null;
  priceId: string;
  offer: StripeOffer | null;
};

export type StripeBillingPaymentMethod = {
  type: string | null;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
};

export type StripeBillingAddress = {
  line1: string | null;
  line2: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};

export type StripeBillingOverview = {
  subscription: StripeBillingSubscription | null;
  paymentMethod: StripeBillingPaymentMethod | null;
  billingEmail: string | null;
  billingAddress: StripeBillingAddress | null;
};

export type StripeInvoicePresenter = {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  currency: string;
  createdAt: Date;
  periodStart: Date | null;
  periodEnd: Date | null;
  subscriptionId: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

export type StripeInvoicePagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

export type StripeInvoiceListPresenter = {
  data: StripeInvoicePresenter[];
  pagination?: StripeInvoicePagination;
};
