import { USER_PROFILE_AVAILABILITY_SLOTS, USER_PROFILE_AVAILABILITY_WEEKDAYS, UserProfileAvailabilitySlot, UserProfileAvailabilityWeekday } from '@neeft-sas/shared';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('user_profile_availabilities')
@Unique('uq_user_profile_availabilities_profile_weekday_slot', ['userProfileId', 'weekday', 'slot'])
export class UserProfileAvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_profile_id', type: 'uuid' })
  userProfileId!: string;

  @Column({ type: 'enum', enum: USER_PROFILE_AVAILABILITY_WEEKDAYS })
  weekday!: UserProfileAvailabilityWeekday;

  @Column({ type: 'enum', enum: USER_PROFILE_AVAILABILITY_SLOTS })
  slot!: UserProfileAvailabilitySlot;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
