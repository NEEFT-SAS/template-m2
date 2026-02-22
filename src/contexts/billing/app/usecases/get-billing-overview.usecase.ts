import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BILLING_SUBJECT_REPOSITORY, BillingSubjectRepositoryPort } from '../ports/billing-subject.repository.port';
import { StripeService } from '../../infra/stripe/stripe.service';
import { StripeBillingOverview } from '../../billing-management.types';

export type GetBillingOverviewInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string | null;
};

@Injectable()
export class GetBillingOverviewUseCase {
  constructor(
    @Inject(BILLING_SUBJECT_REPOSITORY)
    private readonly subjects: BillingSubjectRepositoryPort,
    private readonly stripe: StripeService,
  ) {}

  async execute(input: GetBillingOverviewInput): Promise<StripeBillingOverview> {
    if (!input.subjectId) {
      throw new BadRequestException('Subject id is required');
    }

    const stripeCustomerId = await this.subjects.findStripeCustomerId({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    });

    if (!stripeCustomerId) {
      return {
        subscription: null,
        paymentMethod: null,
        billingEmail: null,
        billingAddress: null,
      };
    }

    return this.stripe.getBillingOverview(stripeCustomerId);
  }
}
