import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AdAccountMemberEntity } from './ad-account-member.entity';
import { AdCampaignEntity } from './ad-campaign.entity';

@Entity('ad_accounts')
export class AdAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  stripeCustomerId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AdAccountMemberEntity, (member) => member.account)
  members?: AdAccountMemberEntity[];

  @OneToMany(() => AdCampaignEntity, (campaign) => campaign.account)
  campaigns?: AdCampaignEntity[];
}

