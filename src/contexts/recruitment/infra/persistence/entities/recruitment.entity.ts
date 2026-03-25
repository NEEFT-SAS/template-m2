import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGamePositionEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-positions.entity';
import { RscGameRankEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-ranks.entity';
import { RecruitmentQuestionEntity } from './recruitment-question.entity';
import { RecruitmentApplicationEntity } from './recruitment-application.entity';
import { TEAM_RECRUITMENT_TARGETS, TeamRecruitmentTarget } from '../../../domain/types/recruitment.types';

@Entity('team_recruitments')
@Unique(['team', 'slug'])
export class RecruitmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @Column({ name: 'team_id', type: 'uuid' })
  teamId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  urgent!: boolean;

  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid!: boolean;

  @Column({ type: 'simple-json', nullable: true })
  missions!: string[] | null;

  @Column({
    type: 'enum',
    enum: TEAM_RECRUITMENT_TARGETS,
    enumName: 'team_recruitment_target_enum',
    default: 'MEMBER',
  })
  target!: TeamRecruitmentTarget;

  @ManyToOne(() => RscGameEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity | null;

  @Column({ name: 'game_id', type: 'int', nullable: true })
  gameId!: number | null;

  @ManyToMany(() => RscGamePositionEntity, { eager: true })
  @JoinTable({
    name: 'team_recruitment_positions',
    joinColumn: { name: 'recruitment_id' },
    inverseJoinColumn: { name: 'game_position_id' },
  })
  positions?: RscGamePositionEntity[];

  @ManyToMany(() => RscGameRankEntity, { eager: true })
  @JoinTable({
    name: 'team_recruitment_ranks',
    joinColumn: { name: 'recruitment_id' },
    inverseJoinColumn: { name: 'game_rank_id' },
  })
  ranks?: RscGameRankEntity[];

  @ManyToOne(() => RscGameRankEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'min_rank_id' })
  minRank!: RscGameRankEntity | null;

  @ManyToOne(() => RscGameRankEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'max_rank_id' })
  maxRank!: RscGameRankEntity | null;

  @Column({ name: 'min_elo', type: 'int', nullable: true, unsigned: true })
  minElo!: number | null;

  @Column({ name: 'max_elo', type: 'int', nullable: true, unsigned: true })
  maxElo!: number | null;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @OneToMany(() => RecruitmentQuestionEntity, (question) => question.recruitment, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  questions?: RecruitmentQuestionEntity[];

  @OneToMany(() => RecruitmentApplicationEntity, (application) => application.recruitment)
  applications?: RecruitmentApplicationEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
