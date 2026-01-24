import { USER_PROFILE_AVAILABILITY_SLOTS, USER_PROFILE_AVAILABILITY_WEEKDAYS, UserProfileAvailabilitySlot, UserProfileAvailabilityWeekday } from '@neeft-sas/shared';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

@Entity('user_profile_availabilities')
@Unique('uq_user_profile_availabilities_profile_weekday_slot', ['userProfile', 'weekday', 'slot'])
export class UserProfileAvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: USER_PROFILE_AVAILABILITY_WEEKDAYS })
  weekday!: UserProfileAvailabilityWeekday;

  @Column({ type: 'enum', enum: USER_PROFILE_AVAILABILITY_SLOTS })
  slot!: UserProfileAvailabilitySlot;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile!: UserProfileEntity;
}
