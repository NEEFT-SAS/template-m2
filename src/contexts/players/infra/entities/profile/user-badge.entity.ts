import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

@Entity('user_badges')
@Index(['userProfile', 'rscBadgeId'], { unique: true })
export class UserBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rsc_badge_id', type: 'int' })
  rscBadgeId!: number;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile!: UserProfileEntity;
}
