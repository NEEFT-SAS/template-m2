import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BILLING_SUBJECT_REPOSITORY, BillingSubjectRepositoryPort } from '../ports/billing-subject.repository.port';
import { StripeService } from '../../infra/stripe/stripe.service';
import { BillingAddressDto } from '../../api/dtos/billing-address.dto';
import { StripeBillingOverview } from '../../billing-management.types';

export type UpdateBillingAddressInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string | null;
  data: BillingAddressDto;
};

@Injectable()
export class UpdateBillingAddressUseCase {
  constructor(
    @Inject(BILLING_SUBJECT_REPOSITORY)
    private readonly subjects: BillingSubjectRepositoryPort,
    private readonly stripe: StripeService,
  ) {}

  async execute(input: UpdateBillingAddressInput): Promise<StripeBillingOverview> {
    if (!input.subjectId) {
      throw new BadRequestException('Subject id is required');
    }

    const stripeCustomerId = await this.subjects.findStripeCustomerId({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    });

    if (!stripeCustomerId) {
      throw new BadRequestException('Stripe customer not found');
    }

    return this.stripe.updateBillingAddress(stripeCustomerId, input.data);
  }
}
