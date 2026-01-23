/***************************
 * StripeWebhookController
 *
 * Receives Stripe events and verifies signature with raw body.
 * Must use rawBody to avoid signature mismatch.
 ***************************/

import { Controller, Headers, HttpCode, Logger, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Controller('billing/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!apiKey) throw new Error('STRIPE_SECRET_KEY is missing');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is missing');

    this.webhookSecret = webhookSecret;

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  @Post('webhook')
  @HttpCode(200)
  async handle(@Req() req: Request, @Headers('stripe-signature') signature?: string) {
    const rawBody = this.getRawBody(req);
    if (!rawBody || !signature) return { received: true };

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Invalid webhook signature: ${(err as Error).message}`);
      return { received: true };
    }

    try {
      await this.dispatch(event);
    } catch (err) {
      this.logger.error(`Webhook dispatch failed: ${(err as Error).message}`, (err as any)?.stack);
      return { received: true };
    }

    return { received: true };
  }

  private async dispatch(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        this.logger.log(`payment_intent.succeeded id=${pi.id}`);
        return;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.log(`invoice.payment_succeeded id=${invoice.id}`);
        return;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        this.logger.log(`customer.subscription.updated id=${sub.id} status=${sub.status}`);
        return;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        this.logger.log(`customer.subscription.deleted id=${sub.id}`);
        return;
      }

      default: {
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
        return;
      }
    }
  }

  private getRawBody(req: Request): Buffer | null {
    const rb = (req as any).rawBody;
    if (Buffer.isBuffer(rb)) return rb;
    if (typeof rb === 'string') return Buffer.from(rb);

    const body: any = (req as any).body;
    if (Buffer.isBuffer(body)) return body;
    if (typeof body === 'string') return Buffer.from(body);

    return null;
  }
}
