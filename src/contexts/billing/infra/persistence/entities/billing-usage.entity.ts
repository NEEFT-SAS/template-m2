import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('billing_monthly_usages')
@Index('IDX_billing_monthly_usage_unique', ['subjectType', 'subjectId', 'monthKey', 'limitKey'], { unique: true })
export class BillingMonthlyUsageEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'subject_type', type: 'varchar', length: 32 })
  subjectType: string;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @Column({ name: 'month_key', type: 'varchar', length: 7 })
  monthKey: string; // YYYY-MM

  @Column({ name: 'limit_key', type: 'varchar', length: 64 })
  limitKey: string;

  @Column({ name: 'used', type: 'int', default: 0 })
  used: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
