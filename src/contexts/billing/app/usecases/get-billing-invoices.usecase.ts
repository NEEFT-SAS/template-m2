import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BILLING_SUBJECT_REPOSITORY, BillingSubjectRepositoryPort } from '../ports/billing-subject.repository.port';
import { StripeService } from '../../infra/stripe/stripe.service';
import { BillingInvoicesQueryDto } from '../../api/dtos/billing-invoices-query.dto';
import { StripeInvoiceListPresenter } from '../../billing-management.types';

export type GetBillingInvoicesInput = {
  subjectType: BillingSubjectTypeEnum;
  subjectId: string | null;
  query: BillingInvoicesQueryDto;
};

@Injectable()
export class GetBillingInvoicesUseCase {
  constructor(
    @Inject(BILLING_SUBJECT_REPOSITORY)
    private readonly subjects: BillingSubjectRepositoryPort,
    private readonly stripe: StripeService,
  ) {}

  async execute(input: GetBillingInvoicesInput): Promise<StripeInvoiceListPresenter> {
    if (!input.subjectId) {
      throw new BadRequestException('Subject id is required');
    }

    const stripeCustomerId = await this.subjects.findStripeCustomerId({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    });

    if (!stripeCustomerId) {
      const limit = Math.min(Math.max(input.query.perPage ?? input.query.limit ?? 20, 1), 100);
      return {
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: limit,
        },
      };
    }

    return this.stripe.getInvoices(stripeCustomerId, input.query);
  }
}
