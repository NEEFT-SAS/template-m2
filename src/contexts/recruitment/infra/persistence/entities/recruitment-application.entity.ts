import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { RecruitmentEntity } from './recruitment.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { RecruitmentAnswerEntity } from './recruitment-answer.entity';
import { RscGamePositionEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-positions.entity';
import { TEAM_RECRUITMENT_APPLICATION_STATUSES, TeamRecruitmentApplicationStatus } from '../../../domain/types/recruitment.types';

@Entity('team_recruitment_applications')
@Unique(['recruitmentId', 'candidateId'])
export class RecruitmentApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RecruitmentEntity, (recruitment) => recruitment.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recruitment_id' })
  recruitment!: RecruitmentEntity;

  @Column({ name: 'recruitment_id', type: 'uuid' })
  recruitmentId!: string;

  @ManyToOne(() => UserProfileEntity, { eager: true })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: UserProfileEntity;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId!: string;

  @Column({
    type: 'enum',
    enum: TEAM_RECRUITMENT_APPLICATION_STATUSES,
    enumName: 'team_recruitment_application_status_enum',
    default: 'PENDING',
  })
  status!: TeamRecruitmentApplicationStatus;

  @Column({ type: 'text', nullable: true })
  motivation!: string | null;

  @ManyToOne(() => RscGamePositionEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'position_id' })
  position!: RscGamePositionEntity | null;

  @Column({ name: 'position_id', type: 'int', nullable: true })
  positionId!: number | null;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason!: string | null;

  @OneToMany(() => RecruitmentAnswerEntity, (answer) => answer.application, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  answers?: RecruitmentAnswerEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}
