import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { DomainError } from '@/core/errors/domain-error';

import { AUTH_REPOSITORY, AuthRepositoryPort } from '../ports/auth.repository.port';

import { BILLING_SUBJECT_REPOSITORY, BillingSubjectRepositoryPort } from '@/contexts/billing/app/ports/billing-subject.repository.port';

import { BillingEntitlementsResolver } from '@/contexts/billing/infra/entitlements/billing-entitlements.resolver';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';
import { BillingPlanKeyEnum } from '@/contexts/billing/infra/entitlements/billing-plans.registry';
import { BILLING_CREDIT_BALANCE_REPOSITORY, BillingCreditBalanceRepositoryPort } from '@/contexts/billing/app/ports/billing-credit.repository.port';

@Injectable()
export class GetUserSessionUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepositoryPort,

    @Inject(BILLING_SUBJECT_REPOSITORY) private readonly billingSubjects: BillingSubjectRepositoryPort,
    @Inject(BILLING_CREDIT_BALANCE_REPOSITORY) private readonly creditBalances: BillingCreditBalanceRepositoryPort,

    private readonly entitlements: BillingEntitlementsResolver,
  ) {}

  async execute(userCredentialId: string): Promise<any> {
    if (!userCredentialId) {
      throw new DomainError({
        code: 'AUTH_SESSION_INVALID',
        message: 'Invalid session',
        statusCode: 401,
      });
    }

    /***************************
     * Profile (player session only)
     ***************************/
    const profile = await this.authRepo.findProfileByCredentialId(userCredentialId);

    if (!profile) {
      throw new DomainError({
        code: 'AUTH_SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 401,
      });
    }

    const player = {
      userCredentialId,
      userProfileId: profile.id,
      slug: profile.slug,
      username: profile.username,
      profilePicture: profile.profilePicture ?? null,
      bannerPicture: profile.bannerPicture ?? null,
    };

    /***************************
     * Billing (subject = PLAYER)
     ***************************/
    const subjectType = BillingSubjectTypeEnum.PLAYER;
    const subjectId = profile.id;

    const planKey =
      (await this.billingSubjects.findActivePlanKey({
        subjectType,
        subjectId,
      })) ?? BillingPlanKeyEnum.FREE;

    const entitlements = await this.entitlements.resolveRemainingOnly({
      subjectType,
      subjectId,
      currentPlanKey: planKey,
    });

    const payload = {
      player,
      billing: {
        planKey,
        entitlements: {
          features: entitlements.features,
          limits: entitlements.limits,
        },
      },
    };
    
    return payload;
    //return plainToInstance(UserSessionPresenter, payload, {
    //  excludeExtraneousValues: true,
    //});
  }
}
