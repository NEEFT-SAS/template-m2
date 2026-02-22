import { forwardRef, Module } from "@nestjs/common";
import { BillingController } from "./api/billing.controller";
import { ListBillingCatalogUseCase } from "./app/usecases/list-billing-catalog.usecase";
import { STRIPE_PORT } from "./app/ports/stripe.port";
import { StripeService } from "./infra/stripe/stripe.service";
import { TOKEN_SERVICE } from "../auth/app/ports/token.port";
import { AuthModule } from "../auth/auth.module";
import { CreateSubscriptionPaymentIntentUseCase } from "./app/usecases/create-subscription-payment-intent.use-case";
import { GetBillingOverviewUseCase } from "./app/usecases/get-billing-overview.usecase";
import { GetBillingInvoicesUseCase } from "./app/usecases/get-billing-invoices.usecase";
import { UpdateBillingAddressUseCase } from "./app/usecases/update-billing-address.usecase";
import { BILLING_SUBJECT_REPOSITORY } from "./app/ports/billing-subject.repository.port";
import { BillingSubjectRepositoryTypeorm } from "./infra/persistence/repositories/billing-subject.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserProfileEntity } from "../auth/infra/persistence/entities/user-profile.entity";
import { StripeWebhookController } from "./api/stripe-webhook.controller";
import { BillingEntitlementsResolver } from "./infra/entitlements/billing-entitlements.resolver";
import { BillingMonthlyUsageEntity } from "./infra/persistence/entities/billing-usage.entity";
import { BillingUsageRepositoryTypeorm } from "./infra/persistence/repositories/billing-usage.repository";
import { BILLING_USAGE_REPOSITORY } from "./app/ports/billing-usage.repository.port";
import { BILLING_CREDIT_BALANCE_REPOSITORY } from "./app/ports/billing-credit.repository.port";
import { BillingCreditBalanceRepository } from "./infra/persistence/repositories/billing-credit-balance.repository";
import { BillingCreditBalanceEntity } from "./infra/persistence/entities/billing-credit-balance.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfileEntity,
      BillingMonthlyUsageEntity,
      BillingCreditBalanceEntity,
    ]),
    forwardRef(() => AuthModule)
  ],
  controllers: [
    BillingController,
    StripeWebhookController,
  ],
  providers: [
    ListBillingCatalogUseCase,
    CreateSubscriptionPaymentIntentUseCase,
    GetBillingOverviewUseCase,
    GetBillingInvoicesUseCase,
    UpdateBillingAddressUseCase,
    BillingEntitlementsResolver,
    StripeService,
    { provide: STRIPE_PORT, useExisting: StripeService },
    { provide: BILLING_SUBJECT_REPOSITORY, useClass: BillingSubjectRepositoryTypeorm },
    { provide: BILLING_USAGE_REPOSITORY, useClass: BillingUsageRepositoryTypeorm },
    { provide: BILLING_CREDIT_BALANCE_REPOSITORY, useClass: BillingCreditBalanceRepository },
  ],
  exports: [STRIPE_PORT, BILLING_SUBJECT_REPOSITORY, BILLING_CREDIT_BALANCE_REPOSITORY, BillingEntitlementsResolver],
})

export class BillingModule {}
