/***************************
 * BillingSubjectRepositoryTypeorm
 *
 * Stores stripeCustomerId on:
 * - user_profiles (player)
 * - teams (team)
 ***************************/

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingSubjectRef, BillingSubjectRepositoryPort, FindStripeCustomerIdInput, SetActivePlanKeyInput, SetStripeCustomerIdInput } from '@/contexts/billing/app/ports/billing-subject.repository.port';

import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { BillingPlanKeyEnum } from '../../entitlements/billing-plans.registry';
import { BillingSubjectTypeEnum } from '@neeft-sas/shared';

@Injectable()
export class BillingSubjectRepositoryTypeorm implements BillingSubjectRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity) private readonly profilesRepo: Repository<UserProfileEntity>,

    // @InjectRepository(TeamEntity)
    // private readonly teamsRepo: Repository<TeamEntity>,
  ) {}

  async findStripeCustomerId(input: FindStripeCustomerIdInput): Promise<string | null> {
    if (input.subjectType === 'player') {
      const row = await this.profilesRepo.findOne({
        where: { id: input.subjectId },
        select: { id: true, stripeCustomerId: true },
      });

      return row?.stripeCustomerId ?? null;
    }

    /* const row = await this.teamsRepo.findOne({
      where: { id: input.subjectId },
      select: { id: true, stripeCustomerId: true },
    }); */

    // return row?.stripeCustomerId ?? null;
  }

  async setStripeCustomerId(input: SetStripeCustomerIdInput): Promise<void> {
    if (input.subjectType === 'player') {
      await this.profilesRepo.update(
        { id: input.subjectId },
        { stripeCustomerId: input.stripeCustomerId },
      );
      return;
    }

    // await this.teamsRepo.update(
    //   { id: input.subjectId },
    //   { stripeCustomerId: input.stripeCustomerId },
    // );
  }

  async findActivePlanKey(input: BillingSubjectRef): Promise<BillingPlanKeyEnum | null> {
    if (input.subjectType !== BillingSubjectTypeEnum.PLAYER) return null;

    const row = await this.profilesRepo.findOne({
      where: { id: input.subjectId },
      select: ['id', 'billingPlanKey'],
    });

    return row?.billingPlanKey ?? null;
  }

  async setActivePlanKey(input: SetActivePlanKeyInput): Promise<void> {
    if (input.subjectType !== BillingSubjectTypeEnum.PLAYER) return;

    await this.profilesRepo.update(
      { id: input.subjectId },
      { billingPlanKey: input.planKey },
    );
  }
}
