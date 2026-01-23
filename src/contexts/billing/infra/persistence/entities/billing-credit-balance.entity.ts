import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('billing_credit_balances')
@Index('IDX_credit_balance_unique', ['subjectType', 'subjectId', 'creditKey'], { unique: true })
export class BillingCreditBalanceEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'subject_type', type: 'varchar', length: 32 })
  subjectType: string;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @Column({ name: 'credit_key', type: 'varchar', length: 64 })
  creditKey: string;

  @Column({ name: 'balance', type: 'int', default: 0 })
  balance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
