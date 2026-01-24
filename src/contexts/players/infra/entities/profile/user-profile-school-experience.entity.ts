import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { USER_PROFILE_ATTENDANCE_MODES, USER_PROFILE_EDUCATION_STATUSES, UserProfileAttendanceMode, UserProfileEducationStatus } from '@neeft-sas/shared';

@Entity('user_profile_school_experiences')
export class UserProfileSchoolExperienceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: UserProfileEntity;

  @Column({ type: 'varchar', length: 255 })
  schoolName!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  schoolLogoUrl!: string | null;

  @Column({ type: 'varchar', length: 255 })
  diplomaName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({
    type: 'enum',
    enum: USER_PROFILE_EDUCATION_STATUSES,
    enumName: 'user_profile_education_status_enum',
    nullable: true,
  })
  educationStatus!: UserProfileEducationStatus | null;

  @Column({
    type: 'enum',
    enum: USER_PROFILE_ATTENDANCE_MODES,
    enumName: 'user_profile_attendance_mode_enum',
    nullable: true,
  })
  attendanceMode!: UserProfileAttendanceMode | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mention!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
