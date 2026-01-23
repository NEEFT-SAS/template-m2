import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingUsageRepositoryPort, GetMonthlyUsageInput, TryConsumeMonthlyUsageInput } from '@/contexts/billing/app/ports/billing-usage.repository.port';
import { BillingMonthlyUsageEntity } from '../entities/billing-usage.entity';

@Injectable()
export class BillingUsageRepositoryTypeorm implements BillingUsageRepositoryPort {
  constructor(@InjectRepository(BillingMonthlyUsageEntity) private readonly repo: Repository<BillingMonthlyUsageEntity>) {}

  async getMonthlyUsage(input: GetMonthlyUsageInput): Promise<number> {
    const row = await this.repo.findOne({
      where: {
        subjectType: String(input.subjectType),
        subjectId: input.subjectId,
        monthKey: input.monthKey,
        limitKey: String(input.limitKey),
      },
      select: { used: true },
    });

    return row?.used ?? 0;
  }

  async tryConsumeMonthlyUsage(input: TryConsumeMonthlyUsageInput): Promise<boolean> {
    const amount = input.amount ?? 1;
    if (amount <= 0) return true;
    if (input.baseLimit <= 0) return false;

    const subjectType = String(input.subjectType);
    const limitKey = String(input.limitKey);

    try {
      await this.repo.insert({
        subjectType,
        subjectId: input.subjectId,
        monthKey: input.monthKey,
        limitKey,
        used: 0,
      });
    } catch {
      // ignore duplicate
    }

    const res = await this.repo
      .createQueryBuilder()
      .update(BillingMonthlyUsageEntity)
      .set({ used: () => `used + ${amount}` })
      .where('subject_type = :subjectType', { subjectType })
      .andWhere('subject_id = :subjectId', { subjectId: input.subjectId })
      .andWhere('month_key = :monthKey', { monthKey: input.monthKey })
      .andWhere('limit_key = :limitKey', { limitKey })
      .andWhere(`used + ${amount} <= :baseLimit`, { baseLimit: input.baseLimit })
      .execute();

    return (res.affected ?? 0) > 0;
  }
}
