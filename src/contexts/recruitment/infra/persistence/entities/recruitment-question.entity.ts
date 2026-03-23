import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecruitmentEntity } from './recruitment.entity';
import { TEAM_RECRUITMENT_QUESTION_TYPES, TeamRecruitmentQuestionType } from '../../../domain/types/recruitment.types';

@Entity('team_recruitment_questions')
export class RecruitmentQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RecruitmentEntity, (recruitment) => recruitment.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recruitment_id' })
  recruitment!: RecruitmentEntity;

  @Column({ name: 'recruitment_id', type: 'uuid' })
  recruitmentId!: string;

  @Column({ type: 'varchar', length: 2048 })
  prompt!: string;

  @Column({
    type: 'enum',
    enum: TEAM_RECRUITMENT_QUESTION_TYPES,
    enumName: 'team_recruitment_question_type_enum',
    default: 'LONG_TEXT',
  })
  type!: TeamRecruitmentQuestionType;

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired!: boolean;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
