import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { REPORT_REASONS, REPORT_STATUSES, REPORT_TARGET_TYPES, ReportReason, ReportStatus, ReportTargetType } from '../../../domain/types/profile-report.types';

@Entity('profile_reports')
export class ProfileReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'target_type', type: 'enum', enum: REPORT_TARGET_TYPES })
  targetType!: ReportTargetType;

  @Column({ type: 'enum', enum: REPORT_REASONS })
  reason!: ReportReason;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'enum', enum: REPORT_STATUSES, default: 'PENDING' })
  status!: ReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_profile_id' })
  reporterProfile!: UserProfileEntity;

  @Index()
  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_user_profile_id' })
  reportedUserProfile!: UserProfileEntity | null;

  @Index()
  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_team_id' })
  reportedTeam!: TeamEntity | null;
}
