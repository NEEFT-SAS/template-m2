/***************************
 * StripeService
 *
 * Impl StripePort via SDK Stripe officiel.
 * Ici on met des logs + cast any parce que Stripe typings changent souvent.
 ***************************/

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateCustomerInput, CreateSubscriptionInput, CreateSubscriptionOutput, ListPricesInput, StripeCustomerRecord, StripePort, StripePriceRecord } from '@/contexts/billing/app/ports/stripe.port';
import { BillingAddressDto } from '../../api/dtos/billing-address.dto';
import { BillingInvoicesQueryDto } from '../../api/dtos/billing-invoices-query.dto';
import { StripeBillingAddress, StripeBillingOverview, StripeBillingPaymentMethod, StripeInvoiceListPresenter, StripeInvoicePresenter, StripeOffer } from '../../billing-management.types';

@Injectable()
export class StripeService implements StripePort {
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');

    const apiVersion = this.config.get<string>('STRIPE_API_VERSION');

    this.stripe = new Stripe(secretKey, {
      apiVersion: (apiVersion as any) ?? undefined,
    });

    console.log('[StripeService] init', {
      apiVersion: apiVersion ?? '(default)',
      mode: secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE',
    });
  }

  async createCustomer(input: CreateCustomerInput): Promise<StripeCustomerRecord> {
    const customer = await this.stripe.customers.create({
      ...(input.email ? { email: input.email } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    });

    console.log('[StripeService] customer created', { id: customer.id });

    return { id: customer.id };
  }

  async listPrices(input: ListPricesInput): Promise<StripePriceRecord[]> {
    const res = await this.stripe.prices.list({
      active: true,
      limit: 100,
      ...(input.lookupKeys?.length ? { lookup_keys: input.lookupKeys } : {}),
      ...(input.type === 'recurring' ? { type: 'recurring' } : { type: 'one_time' }),
    });

    return res.data.map((p) => ({
      id: p.id,
      lookup_key: p.lookup_key,
      currency: p.currency,
      unit_amount: p.unit_amount,
      type: p.type,
      recurring: p.recurring ? { interval: p.recurring.interval as any } : null,
    }));
  }

  /***************************
   * IMPORTANT
   *
   * Dans Stripe "default_incomplete", Stripe crée un Invoice (latest_invoice).
   * Sur cet invoice, il y a soit:
   * - invoice.payment_intent => PaymentIntent
   * - ou invoice.confirmation_secret => client_secret (selon API/version)
   *
   * Ton but: récupérer un clientSecret utilisable côté front.
   ***************************/
async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
  console.log('[StripeService] createSubscription input', input);

  const sub: any = await this.stripe.subscriptions.create({
    customer: input.customerId,
    items: [{ price: input.priceId }],

    // ✅ indispensable pour custom flow
    collection_method: 'charge_automatically',
    payment_behavior: 'default_incomplete',

    metadata: input.metadata ?? {},

    payment_settings: {
      save_default_payment_method: 'on_subscription',
      // optionnel: tu peux garder card only, mais APV préfère automatic_payment_methods si activé
      payment_method_types: ['card'],
    },

    // ✅ IMPORTANT : récupérer le client_secret via confirmation_secret (basil)
    expand: [
      'latest_invoice.confirmation_secret',
      'latest_invoice.payment_intent', // fallback ancienne version
      'pending_setup_intent',
    ],
  });

  const latestInvoice: any = sub.latest_invoice && typeof sub.latest_invoice !== 'string'
    ? sub.latest_invoice
    : null;

  const invoiceId =
    typeof sub.latest_invoice === 'string' ? sub.latest_invoice : latestInvoice?.id ?? null;

  console.log('[StripeService] subscription created', {
    id: sub.id,
    status: sub.status,
    invoiceId,
  });

  // Helper pour mapper les infos invoice
  const mapInvoiceInfo = (inv: any) => ({
    hostedInvoiceUrl: inv?.hosted_invoice_url ?? null,
    amountDue: typeof inv?.amount_due === 'number' ? inv.amount_due : null,
    currency: inv?.currency ?? null,
    collectionMethod: inv?.collection_method ?? null,
  });

  /**
   * ✅ CAS 1 : Basil -> confirmation_secret (recommandé Payment Element)
   * Stripe recommande d'expand confirmation_secret sur latest_invoice
   */
  if (latestInvoice?.confirmation_secret?.client_secret) {
    const info = mapInvoiceInfo(latestInvoice);

    console.log('[StripeService] invoice.confirmation_secret found', {
      invoiceId: latestInvoice.id,
      hasClientSecret: true,
      amountDue: info.amountDue,
      collectionMethod: info.collectionMethod,
    });

    return {
      id: sub.id,
      intentType: 'payment',
      clientSecret: latestInvoice.confirmation_secret.client_secret,

      invoiceId: latestInvoice.id ?? null,
      hostedInvoiceUrl: info.hostedInvoiceUrl,
      amountDue: info.amountDue,
      currency: info.currency,

      paymentIntentId: null,
      setupIntentId: null,
    };
  }

  /**
   * ✅ CAS 1 bis : Anciennes versions -> payment_intent.client_secret
   */
  const piDirect: any = latestInvoice?.payment_intent;
  if (piDirect && typeof piDirect !== 'string' && piDirect?.client_secret) {
    const info = mapInvoiceInfo(latestInvoice);

    console.log('[StripeService] invoice.payment_intent found', {
      id: piDirect.id,
      hasClientSecret: true,
      amountDue: info.amountDue,
      collectionMethod: info.collectionMethod,
    });

    return {
      id: sub.id,
      intentType: 'payment',
      clientSecret: piDirect.client_secret,

      invoiceId: latestInvoice.id ?? null,
      hostedInvoiceUrl: info.hostedInvoiceUrl,
      amountDue: info.amountDue,
      currency: info.currency,

      paymentIntentId: piDirect.id ?? null,
      setupIntentId: null,
    };
  }

  /**
   * ✅ CAS 2 : Hosted invoice (send_invoice / paiement manuel)
   */
  if (latestInvoice?.collection_method === 'send_invoice' && latestInvoice?.hosted_invoice_url) {
    const info = mapInvoiceInfo(latestInvoice);

    console.log('[StripeService] hosted invoice flow', {
      invoiceId: latestInvoice.id,
      hostedInvoiceUrl: latestInvoice.hosted_invoice_url,
    });

    return {
      id: sub.id,
      intentType: 'hosted_invoice',
      clientSecret: null,

      invoiceId: latestInvoice.id ?? null,
      hostedInvoiceUrl: latestInvoice.hosted_invoice_url,
      amountDue: info.amountDue,
      currency: info.currency,

      paymentIntentId: null,
      setupIntentId: null,
    };
  }

  /**
   * ✅ CAS 3 : SetupIntent (trial / pas de paiement immédiat mais on veut une carte)
   */
  const pendingSetup: any = sub.pending_setup_intent;
  if (pendingSetup && typeof pendingSetup !== 'string' && pendingSetup?.client_secret) {
    console.log('[StripeService] pending_setup_intent found', {
      id: pendingSetup.id,
      hasClientSecret: true,
    });

    return {
      id: sub.id,
      intentType: 'setup',
      clientSecret: pendingSetup.client_secret,

      invoiceId: invoiceId,
      hostedInvoiceUrl: latestInvoice?.hosted_invoice_url ?? null,
      amountDue: typeof latestInvoice?.amount_due === 'number' ? latestInvoice.amount_due : null,
      currency: latestInvoice?.currency ?? null,

      paymentIntentId: null,
      setupIntentId: pendingSetup.id ?? null,
    };
  }

  /**
   * ✅ CAS 4 : fallback retrieve invoice (avec expand confirmation_secret)
   */
  if (invoiceId) {
    console.log('[StripeService] retrieve invoice for confirmation_secret', { invoiceId });

    let invoice: any = await this.stripe.invoices.retrieve(invoiceId, {
      expand: ['confirmation_secret', 'payment_intent'],
    });

    // draft -> finalize (sinon pas de secret)
    if (invoice.status === 'draft') {
      console.log('[StripeService] invoice draft -> finalize', { invoiceId });

      await this.stripe.invoices.finalizeInvoice(invoiceId);

      invoice = await this.stripe.invoices.retrieve(invoiceId, {
        expand: ['confirmation_secret', 'payment_intent'],
      });
    }

    const info = mapInvoiceInfo(invoice);

    // ✅ confirmation_secret prioritaire (basil)
    if (invoice?.confirmation_secret?.client_secret) {
      console.log('[StripeService] confirmation_secret resolved via retrieve', {
        invoiceId: invoice.id,
        hasClientSecret: true,
        amountDue: info.amountDue,
      });

      return {
        id: sub.id,
        intentType: 'payment',
        clientSecret: invoice.confirmation_secret.client_secret,

        invoiceId: invoice.id ?? null,
        hostedInvoiceUrl: info.hostedInvoiceUrl,
        amountDue: info.amountDue,
        currency: info.currency,

        paymentIntentId: null,
        setupIntentId: null,
      };
    }

    // ✅ fallback payment_intent (anciennes versions)
    const pi: any = invoice?.payment_intent;
    if (pi && typeof pi !== 'string' && pi?.client_secret) {
      console.log('[StripeService] payment_intent resolved via retrieve', {
        id: pi.id,
        hasClientSecret: true,
        amountDue: info.amountDue,
      });

      return {
        id: sub.id,
        intentType: 'payment',
        clientSecret: pi.client_secret,

        invoiceId: invoice.id ?? null,
        hostedInvoiceUrl: info.hostedInvoiceUrl,
        amountDue: info.amountDue,
        currency: info.currency,

        paymentIntentId: pi.id ?? null,
        setupIntentId: null,
      };
    }

    // Si amount_due = 0 -> normal de ne rien avoir
    if (typeof invoice?.amount_due === 'number' && invoice.amount_due === 0) {
      console.log('[StripeService] invoice amount_due=0 -> no intent needed', { invoiceId });

      return {
        id: sub.id,
        intentType: 'none',
        clientSecret: null,

        invoiceId: invoice.id ?? null,
        hostedInvoiceUrl: info.hostedInvoiceUrl,
        amountDue: info.amountDue,
        currency: info.currency,

        paymentIntentId: null,
        setupIntentId: null,
      };
    }
  }

  /**
   * ✅ Dernier fallback : rien à faire / ou cas inconnu
   */
  console.log('[StripeService] NO clientSecret FOUND -> returning none', {
    subscriptionId: sub.id,
    invoiceId,
  });

  return {
    id: sub.id,
    intentType: 'none',
    clientSecret: null,

    invoiceId,
    hostedInvoiceUrl: latestInvoice?.hosted_invoice_url ?? null,
    amountDue: typeof latestInvoice?.amount_due === 'number' ? latestInvoice.amount_due : null,
    currency: latestInvoice?.currency ?? null,

    paymentIntentId: null,
    setupIntentId: null,
  };
}

  async getBillingOverview(customerId: string): Promise<StripeBillingOverview> {
    const subscription = await this.findLatestStripeSubscription(customerId);
    const billingDetails = await this.getBillingDetails(customerId, subscription);

    if (!subscription) {
      return { subscription: null, ...billingDetails };
    }

    const priceId = subscription.items?.data?.[0]?.price?.id ?? '';
    const offer = priceId ? await this.getOfferDetailsByPriceId(priceId) : null;
    const { startSec, endSec } = this.getStripeSubscriptionPeriodBounds(subscription);

    return {
      subscription: {
        id: subscription.id,
        stripeSubscriptionId: subscription.id,
        status: this.mapStripeSubscriptionStatus(subscription.status),
        startedAt: new Date(startSec * 1000),
        expiredAt: new Date(endSec * 1000),
        trialEndAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        priceId,
        offer,
      },
      ...billingDetails,
    };
  }

  async updateBillingAddress(customerId: string, data: BillingAddressDto): Promise<StripeBillingOverview> {
    if (!this.hasBillingAddressUpdate(data)) {
      throw new BadRequestException('No billing address fields provided');
    }

    const customer = await this.retrieveStripeCustomer(customerId);
    if (!customer) {
      throw new NotFoundException('Stripe customer not found');
    }

    const customerAddress = this.buildStripeAddressUpdate(data, customer.address);
    if (!customerAddress) {
      throw new BadRequestException('Invalid billing address payload');
    }

    await this.stripe.customers.update(customerId, { address: customerAddress });

    let paymentMethodId = this.getPaymentMethodId(customer.invoice_settings?.default_payment_method);
    if (!paymentMethodId) {
      const subscription = await this.findLatestStripeSubscription(customerId);
      paymentMethodId = this.getPaymentMethodId(subscription?.default_payment_method ?? null);
    }

    if (paymentMethodId) {
      const paymentMethod = await this.retrieveStripePaymentMethod(paymentMethodId);
      if (paymentMethod) {
        const paymentMethodAddress = this.buildStripeAddressUpdate(
          data,
          paymentMethod.billing_details?.address ?? null,
        );
        if (paymentMethodAddress) {
          await this.stripe.paymentMethods.update(paymentMethodId, {
            billing_details: {
              address: paymentMethodAddress,
              email: paymentMethod.billing_details?.email ?? undefined,
              name: paymentMethod.billing_details?.name ?? undefined,
              phone: paymentMethod.billing_details?.phone ?? undefined,
            },
          });
        }
      }
    }

    return this.getBillingOverview(customerId);
  }

  async getInvoices(customerId: string, query: BillingInvoicesQueryDto): Promise<StripeInvoiceListPresenter> {
    const limit = Math.min(Math.max(query.perPage ?? query.limit ?? 20, 1), 100);
    const useCursorMode = query.page === undefined && !!query.startingAfter;
    const invoiceStatus = 'paid' as Stripe.InvoiceListParams.Status;

    if (useCursorMode) {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
        status: invoiceStatus,
        starting_after: query.startingAfter ?? undefined,
      });

      return {
        data: invoices.data.map((invoice) => this.mapStripeInvoice(invoice)),
      };
    }

    const totalItems = await this.countInvoices(customerId, invoiceStatus);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const requestedPage = Math.max(query.page ?? 1, 1);
    const effectivePage = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;

    if (totalItems === 0) {
      return {
        data: [],
        pagination: this.buildInvoicePagination(totalItems, totalPages, effectivePage, limit),
      };
    }

    let startingAfter: string | undefined = undefined;
    for (let currentPage = 1; currentPage < effectivePage; currentPage++) {
      const pageResponse = await this.stripe.invoices.list({
        customer: customerId,
        limit,
        status: invoiceStatus,
        starting_after: startingAfter ?? undefined,
      });

      const lastInvoice = pageResponse.data[pageResponse.data.length - 1];
      if (!lastInvoice || !pageResponse.has_more) {
        startingAfter = lastInvoice?.id;
        break;
      }

      startingAfter = lastInvoice.id;
    }

    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
      status: invoiceStatus,
      starting_after: startingAfter ?? undefined,
    });

    return {
      data: invoices.data.map((invoice) => this.mapStripeInvoice(invoice)),
      pagination: this.buildInvoicePagination(totalItems, totalPages, effectivePage, limit),
    };
  }

  private async getOfferDetailsByPriceId(priceId: string): Promise<StripeOffer | null> {
    try {
      const price = await this.stripe.prices.retrieve(priceId, { expand: ['product'] });
      const isDeleted = (value: unknown): value is { deleted: true } =>
        typeof value === 'object' && value !== null && 'deleted' in value;

      if (isDeleted(price)) {
        return null;
      }

      const rawProduct = price.product;
      if (!rawProduct || typeof rawProduct === 'string' || isDeleted(rawProduct)) {
        return null;
      }

      const product = rawProduct as Stripe.Product;

      return {
        id: price.id,
        productId: product.id,
        priceId: price.id,
        name: product.name,
        description: product.description,
        price: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring ? price.recurring.interval : null,
        intervalCount: price.recurring ? price.recurring.interval_count : null,
        features: product.metadata.features ? product.metadata.features.split(',') : [],
        images: product.images ?? [],
        popular: product.metadata.popular === 'true',
        active: price.active && product.active,
        metadata: product.metadata,
      };
    } catch {
      return null;
    }
  }

  private async findLatestStripeSubscription(customerId: string): Promise<Stripe.Subscription | null> {
    const response = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });

    const candidates = response.data.filter((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status),
    );

    const pool = candidates.length ? candidates : response.data;
    if (pool.length === 0) {
      return null;
    }

    pool.sort(
      (a, b) =>
        this.getStripeSubscriptionPeriodBounds(b).endSec -
        this.getStripeSubscriptionPeriodBounds(a).endSec,
    );

    return pool[0] ?? null;
  }

  private mapStripeSubscriptionStatus(
    stripeStatus: Stripe.Subscription.Status,
  ): 'active' | 'expired' | 'canceled' | 'unpaid' {
    switch (stripeStatus) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'past_due':
      case 'unpaid':
        return 'unpaid';
      case 'canceled':
      case 'incomplete_expired':
        return 'canceled';
      default:
        return 'expired';
    }
  }

  private getStripeSubscriptionPeriodBounds(
    stripeSubscription: Stripe.Subscription,
  ): { startSec: number; endSec: number } {
    const subAny = stripeSubscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };
    const nowSec = Math.floor(Date.now() / 1000);
    const startSec =
      subAny.current_period_start ??
      stripeSubscription.billing_cycle_anchor ??
      stripeSubscription.start_date ??
      stripeSubscription.created ??
      nowSec;

    const directEndSec =
      subAny.current_period_end ??
      stripeSubscription.ended_at ??
      stripeSubscription.cancel_at ??
      stripeSubscription.trial_end ??
      null;

    if (directEndSec !== null && directEndSec !== undefined) {
      return { startSec, endSec: directEndSec };
    }

    const recurring = stripeSubscription.items?.data?.[0]?.price?.recurring;
    if (recurring?.interval) {
      const intervalCount = recurring.interval_count ?? 1;
      const endSec = this.addIntervalToEpochSeconds(startSec, recurring.interval, intervalCount);
      return { startSec, endSec };
    }

    return { startSec, endSec: startSec };
  }

  private addIntervalToEpochSeconds(
    startSec: number,
    interval: Stripe.Price.Recurring.Interval,
    intervalCount: number,
  ): number {
    const safeCount = intervalCount > 0 ? Math.floor(intervalCount) : 1;

    switch (interval) {
      case 'day':
        return startSec + safeCount * 86400;
      case 'week':
        return startSec + safeCount * 7 * 86400;
      case 'month': {
        const startDate = new Date(startSec * 1000);
        const startYear = startDate.getUTCFullYear();
        const startMonth = startDate.getUTCMonth();
        const startDay = startDate.getUTCDate();
        const totalMonths = startMonth + safeCount;
        const targetYear = startYear + Math.floor(totalMonths / 12);
        const targetMonth = totalMonths % 12;
        const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
        const targetDay = Math.min(startDay, lastDay);
        const targetDate = new Date(
          Date.UTC(
            targetYear,
            targetMonth,
            targetDay,
            startDate.getUTCHours(),
            startDate.getUTCMinutes(),
            startDate.getUTCSeconds(),
            startDate.getUTCMilliseconds(),
          ),
        );
        return Math.floor(targetDate.getTime() / 1000);
      }
      case 'year': {
        const startDate = new Date(startSec * 1000);
        const targetYear = startDate.getUTCFullYear() + safeCount;
        const targetMonth = startDate.getUTCMonth();
        const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
        const targetDay = Math.min(startDate.getUTCDate(), lastDay);
        const targetDate = new Date(
          Date.UTC(
            targetYear,
            targetMonth,
            targetDay,
            startDate.getUTCHours(),
            startDate.getUTCMinutes(),
            startDate.getUTCSeconds(),
            startDate.getUTCMilliseconds(),
          ),
        );
        return Math.floor(targetDate.getTime() / 1000);
      }
      default:
        return startSec;
    }
  }

  private async getBillingDetails(
    customerId: string | null,
    stripeSubscription: Stripe.Subscription | null,
  ): Promise<{
    paymentMethod: StripeBillingPaymentMethod | null;
    billingEmail: string | null;
    billingAddress: StripeBillingAddress | null;
  }> {
    let resolvedCustomerId = customerId;
    let paymentMethodId: string | null = null;

    if (!resolvedCustomerId && stripeSubscription) {
      if (typeof stripeSubscription.customer === 'string') {
        resolvedCustomerId = stripeSubscription.customer;
      }
      paymentMethodId = this.getPaymentMethodId(stripeSubscription.default_payment_method);
    }

    if (!resolvedCustomerId && !paymentMethodId) {
      return { paymentMethod: null, billingEmail: null, billingAddress: null };
    }

    let billingEmail: string | null = null;
    let billingAddress: StripeBillingAddress | null = null;

    if (resolvedCustomerId) {
      const customer = await this.retrieveStripeCustomer(resolvedCustomerId);
      if (customer) {
        billingEmail = customer.email ?? null;
        billingAddress = this.mapStripeAddress(customer.address);
        if (!paymentMethodId) {
          paymentMethodId = this.getPaymentMethodId(customer.invoice_settings?.default_payment_method);
        }
      }
    }

    if (!paymentMethodId && stripeSubscription) {
      paymentMethodId = this.getPaymentMethodId(stripeSubscription.default_payment_method);
    }

    const paymentMethod = paymentMethodId
      ? await this.retrieveStripePaymentMethod(paymentMethodId)
      : null;

    if (!billingEmail && paymentMethod?.billing_details?.email) {
      billingEmail = paymentMethod.billing_details.email;
    }
    if (!billingAddress) {
      billingAddress = this.mapStripeAddress(paymentMethod?.billing_details?.address);
    }

    return {
      paymentMethod: this.mapStripePaymentMethod(paymentMethod),
      billingEmail,
      billingAddress,
    };
  }

  private async retrieveStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted) {
        return null;
      }
      return customer as Stripe.Customer;
    } catch {
      return null;
    }
  }

  private async retrieveStripePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod | null> {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch {
      return null;
    }
  }

  private getPaymentMethodId(
    paymentMethod: string | Stripe.PaymentMethod | null | undefined,
  ): string | null {
    if (!paymentMethod) {
      return null;
    }
    if (typeof paymentMethod === 'string') {
      return paymentMethod;
    }
    if (typeof paymentMethod === 'object' && 'id' in paymentMethod && typeof paymentMethod.id === 'string') {
      return paymentMethod.id;
    }
    return null;
  }

  private mapStripeAddress(address: Stripe.Address | null | undefined): StripeBillingAddress | null {
    if (!address) {
      return null;
    }
    return {
      line1: address.line1 ?? null,
      line2: address.line2 ?? null,
      postalCode: address.postal_code ?? null,
      city: address.city ?? null,
      state: address.state ?? null,
      country: address.country ?? null,
    };
  }

  private hasBillingAddressUpdate(data: BillingAddressDto): boolean {
    return [
      data.line1,
      data.line2,
      data.postalCode,
      data.city,
      data.state,
      data.country,
    ].some((value) => value !== undefined);
  }

  private buildStripeAddressUpdate(
    data: BillingAddressDto,
    existing: Stripe.Address | null | undefined,
  ): Stripe.AddressParam | null {
    const address: Stripe.AddressParam = {
      line1: data.line1 ?? existing?.line1 ?? undefined,
      line2: data.line2 ?? existing?.line2 ?? undefined,
      postal_code: data.postalCode ?? existing?.postal_code ?? undefined,
      city: data.city ?? existing?.city ?? undefined,
      state: data.state ?? existing?.state ?? undefined,
      country: data.country ?? existing?.country ?? undefined,
    };

    const hasValue = Object.values(address).some((value) => value !== undefined);
    return hasValue ? address : null;
  }

  private mapStripePaymentMethod(
    paymentMethod: Stripe.PaymentMethod | null,
  ): StripeBillingPaymentMethod | null {
    if (!paymentMethod) {
      return null;
    }

    if (paymentMethod.type === 'card' && paymentMethod.card) {
      return {
        type: paymentMethod.type,
        brand: paymentMethod.card.brand ?? null,
        last4: paymentMethod.card.last4 ?? null,
        expMonth: paymentMethod.card.exp_month ?? null,
        expYear: paymentMethod.card.exp_year ?? null,
      };
    }

    return {
      type: paymentMethod.type ?? null,
      brand: null,
      last4: null,
      expMonth: null,
      expYear: null,
    };
  }

  private async countInvoices(
    customerId: string,
    status: Stripe.InvoiceListParams.Status,
  ): Promise<number> {
    let total = 0;
    let startingAfter: string | undefined = undefined;

    while (true) {
      const response = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
        status,
        starting_after: startingAfter ?? undefined,
      });

      total += response.data.length;

      if (!response.has_more || response.data.length === 0) {
        break;
      }

      startingAfter = response.data[response.data.length - 1].id;
    }

    return total;
  }

  private buildInvoicePagination(
    totalItems: number,
    totalPages: number,
    currentPage: number,
    itemsPerPage: number,
  ) {
    return {
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage,
    };
  }

  private mapStripeInvoice(invoice: Stripe.Invoice): StripeInvoicePresenter {
    const invoiceAny = invoice as any;
    const subscriptionId = typeof invoiceAny.subscription === 'string'
      ? invoiceAny.subscription
      : invoiceAny.subscription?.id ?? null;

    return {
      id: invoice.id,
      number: invoice.number ?? null,
      status: invoice.status,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      createdAt: new Date(invoice.created * 1000),
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      subscriptionId,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
    };
  }

}
