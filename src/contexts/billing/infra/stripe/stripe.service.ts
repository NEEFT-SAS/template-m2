/***************************
 * StripeService
 *
 * Impl StripePort via SDK Stripe officiel.
 * Ici on met des logs + cast any parce que Stripe typings changent souvent.
 ***************************/

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreateCustomerInput,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  ListPricesInput,
  StripeCustomerRecord,
  StripePort,
  StripePriceRecord,
} from '@/contexts/billing/app/ports/stripe.port';

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

}
