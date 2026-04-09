import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AdAccountMemberRole } from '../../ads.types';
import { AdAccountEntity } from './ad-account.entity';

@Entity('ad_account_members')
@Index(['account', 'user'], { unique: true })
export class AdAccountMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdAccountEntity, (account) => account.members, { onDelete: 'CASCADE' })
  account: AdAccountEntity;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  user: UserProfileEntity;

  @Column({ type: 'enum', enum: AdAccountMemberRole, default: AdAccountMemberRole.OWNER })
  role: AdAccountMemberRole;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

