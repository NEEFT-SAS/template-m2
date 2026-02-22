/***************************
 * BillingController
 *
 * Exposes:
 * - GET /billing/catalog
 * - GET /billing/overview
 * - GET /billing/invoices
 * - PUT /billing/address
 * - POST /billing/subscriptions/:lookupKey/payment
 * - POST /billing/packs/:lookupKey/payment-intent
 ***************************/

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ListBillingCatalogUseCase } from '../app/usecases/list-billing-catalog.usecase';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateSubscriptionPaymentIntentUseCase } from '../app/usecases/create-subscription-payment-intent.use-case';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { GetBillingOverviewUseCase } from '../app/usecases/get-billing-overview.usecase';
import { GetBillingInvoicesUseCase } from '../app/usecases/get-billing-invoices.usecase';
import { UpdateBillingAddressUseCase } from '../app/usecases/update-billing-address.usecase';
import { BillingInvoicesQueryDto } from './dtos/billing-invoices-query.dto';
import { BillingAddressDto } from './dtos/billing-address.dto';

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
    private readonly getBillingOverview: GetBillingOverviewUseCase,
    private readonly getBillingInvoices: GetBillingInvoicesUseCase,
    private readonly updateBillingAddressUseCase: UpdateBillingAddressUseCase,
    private readonly createSubscriptionPaymentIntentUseCase: CreateSubscriptionPaymentIntentUseCase,
    // private readonly createPackPaymentIntentUseCase: CreatePackPaymentIntentUseCase,
  ) {}

  @Get('catalog')
  @HttpCode(HttpStatus.OK)
  async catalog() {
    return this.listCatalog.execute();
  }

  @Get('overview')
  @UseGuards(ConnectedGuard)
  @HttpCode(HttpStatus.OK)
  async overview(@Req() req: RequestWithUser) {
    if (!req.user?.pid) {
      throw new UnauthorizedException('Utilisateur non authentifie.');
    }

    return this.getBillingOverview.execute({
      subjectType: BillingSubjectTypeEnum.PLAYER,
      subjectId: req.user.pid,
    });
  }

  @Get('invoices')
  @UseGuards(ConnectedGuard)
  @HttpCode(HttpStatus.OK)
  async invoices(@Req() req: RequestWithUser, @Query() query: BillingInvoicesQueryDto) {
    if (!req.user?.pid) {
      throw new UnauthorizedException('Utilisateur non authentifie.');
    }

    return this.getBillingInvoices.execute({
      subjectType: BillingSubjectTypeEnum.PLAYER,
      subjectId: req.user.pid,
      query,
    });
  }

  @Put('address')
  @UseGuards(ConnectedGuard)
  @HttpCode(HttpStatus.OK)
  async updateBillingAddress(@Req() req: RequestWithUser, @Body() body: BillingAddressDto) {
    if (!req.user?.pid) {
      throw new UnauthorizedException('Utilisateur non authentifie.');
    }

    return this.updateBillingAddressUseCase.execute({
      subjectType: BillingSubjectTypeEnum.PLAYER,
      subjectId: req.user.pid,
      data: body,
    });
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
