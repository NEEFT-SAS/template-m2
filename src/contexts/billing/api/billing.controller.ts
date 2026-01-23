/***************************
 * BillingController
 *
 * Exposes:
 * - GET /billing/catalog
 * - POST /billing/subscriptions/:lookupKey/payment
 * - POST /billing/packs/:lookupKey/payment-intent
 ***************************/

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ListBillingCatalogUseCase } from '../app/usecases/list-billing-catalog.usecase';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateSubscriptionPaymentIntentUseCase } from '../app/usecases/create-subscription-payment-intent.use-case';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';

type JwtUser = {
  sub: string; // userCredentialId
  pid?: string; // player userProfileId
  // roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

type CreateSubscriptionPaymentBody = {
  subjectType: BillingSubjectTypeEnum;
  subjectId?: string; // required for team
};

@Controller('billing')
export class BillingController {
  constructor(
    private readonly listCatalog: ListBillingCatalogUseCase,
    private readonly createSubscriptionPaymentIntentUseCase: CreateSubscriptionPaymentIntentUseCase,
    // private readonly createPackPaymentIntentUseCase: CreatePackPaymentIntentUseCase,
  ) {}

  @Get('catalog')
  @HttpCode(HttpStatus.OK)
  async catalog() {
    return this.listCatalog.execute();
  }

  @Post('subscriptions/:lookupKey/payment-intent')
  @UseGuards(ConnectedGuard)
  @HttpCode(HttpStatus.OK)
  async createSubscriptionPayment(@Req() req: RequestWithUser, @Param('lookupKey') lookupKey: string, @Body() body: CreateSubscriptionPaymentBody) {
    const user = req.user;

    const subjectId = body.subjectType === 'player' ? user?.pid ?? null : body.subjectId ?? null;
    return this.createSubscriptionPaymentIntentUseCase.execute({
      lookupKey,
      subjectType: body.subjectType,
      subjectId,
      userCredentialId: user?.sub ?? null,
    });
  }

  //@Post('packs/:lookupKey/payment-intent')
  //@UseGuards(AuthGuard('jwt'))
  //@HttpCode(200)
  //async createPackPaymentIntent(
  //  @Req() req: RequestWithUser,
  //  @Param('lookupKey') lookupKey: string,
  //  @Body() body: CreatePackPaymentIntentBody,
  //) {
  //  const user = req.user;
//
  //  const subjectId =
  //    body.subjectType === 'player' ? user?.profileId ?? null : body.subjectId ?? null;
//
  //  return this.createPackPaymentIntentUseCase.execute({
  //    lookupKey,
  //    subjectType: body.subjectType,
  //    subjectId,
  //    userCredentialId: user?.sub ?? null,
  //    quantity: body.quantity ?? 1,
  //  });
  //}
}
