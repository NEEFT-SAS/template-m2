import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecruitmentApplicationEntity } from './recruitment-application.entity';
import { RecruitmentQuestionEntity } from './recruitment-question.entity';

@Entity('team_recruitment_answers')
export class RecruitmentAnswerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RecruitmentApplicationEntity, (application) => application.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application!: RecruitmentApplicationEntity;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @ManyToOne(() => RecruitmentQuestionEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: RecruitmentQuestionEntity;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answerText!: string | null;

  @Column({ name: 'answer_boolean', type: 'boolean', nullable: true })
  answerBoolean!: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
