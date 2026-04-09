import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AdCampaignPlacement, AdCampaignStatus } from '../../ads.types';
import { AdAccountEntity } from './ad-account.entity';

@Entity('ad_campaigns')
@Index(['status', 'placementKey'])
@Index(['startDate', 'endDate'])
export class AdCampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdAccountEntity, (account) => account.campaigns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: AdAccountEntity;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AdCampaignPlacement })
  placementKey: AdCampaignPlacement;

  @Column({ type: 'enum', enum: AdCampaignStatus, default: AdCampaignStatus.DRAFT })
  status: AdCampaignStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  spent: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ nullable: true })
  targetUrl?: string | null;

  @Column({ nullable: true })
  creativeUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ nullable: true })
  paymentIntentId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

