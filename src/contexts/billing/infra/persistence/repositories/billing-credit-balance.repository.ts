import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingCreditBalanceEntity } from '@/contexts/billing/infra/persistence/entities/billing-credit-balance.entity';
import { AddCreditBalanceInput, BillingCreditBalanceRepositoryPort, ConsumeCreditBalanceInput, GetCreditBalanceInput } from '@/contexts/billing/app/ports/billing-credit.repository.port';

@Injectable()
export class BillingCreditBalanceRepository implements BillingCreditBalanceRepositoryPort {
  constructor(
    @InjectRepository(BillingCreditBalanceEntity) private readonly repo: Repository<BillingCreditBalanceEntity>,
  ) {}

  async getBalance(input: GetCreditBalanceInput): Promise<number> {
    const row = await this.repo.findOne({
      where: {
        subjectType: String(input.subjectType),
        subjectId: input.subjectId,
        creditKey: String(input.creditKey),
      },
      select: { balance: true },
    });

    return row?.balance ?? 0;
  }

  async addCredits(input: AddCreditBalanceInput): Promise<void> {
    if (input.amount <= 0) return;

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(BillingCreditBalanceEntity)
      .values({
        subjectType: String(input.subjectType),
        subjectId: input.subjectId,
        creditKey: String(input.creditKey),
        balance: input.amount,
      })
      .orUpdate(
        ['balance'],
        ['subject_type', 'subject_id', 'credit_key'],
        {
          skipUpdateIfNoValuesChanged: false,
        },
      )
      .execute();

    // ⚠️ MySQL: orUpdate remplace balance => on doit faire un vrai increment
    // donc on fait une update incrémentale ensuite
    await this.repo
      .createQueryBuilder()
      .update(BillingCreditBalanceEntity)
      .set({ balance: () => `balance + ${input.amount}` })
      .where('subject_type = :subjectType', { subjectType: String(input.subjectType) })
      .andWhere('subject_id = :subjectId', { subjectId: input.subjectId })
      .andWhere('credit_key = :creditKey', { creditKey: String(input.creditKey) })
      .execute();
  }

  /**
   * consumeCredits
   * - décrémente si balance suffisante
   * - retourne true si succès sinon false
   */
  async consumeCredits(input: ConsumeCreditBalanceInput): Promise<boolean> {
    if (input.amount <= 0) return true;

    const res = await this.repo
      .createQueryBuilder()
      .update(BillingCreditBalanceEntity)
      .set({ balance: () => `balance - ${input.amount}` })
      .where('subject_type = :subjectType', { subjectType: String(input.subjectType) })
      .andWhere('subject_id = :subjectId', { subjectId: input.subjectId })
      .andWhere('credit_key = :creditKey', { creditKey: String(input.creditKey) })
      .andWhere(`balance >= ${input.amount}`)
      .execute();

    return (res.affected ?? 0) > 0;
  }
}
