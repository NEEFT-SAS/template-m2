import { PlayerReportReason, PlayerReportStatus } from '@neeft-sas/shared';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

@Entity('player_reports')
export class PlayerReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: PlayerReportReason })
  reason!: PlayerReportReason;

  @Column({ type: 'text' })
  details!: string;

  @Column({ type: 'enum', enum: PlayerReportStatus, default: PlayerReportStatus.OPEN })
  status!: PlayerReportStatus;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_profile_id' })
  reporterProfile!: UserProfileEntity;

  @Index()
  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_profile_id' })
  targetProfile!: UserProfileEntity;
}
