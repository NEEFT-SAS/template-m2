import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';

export type RecommendationAuthorType = 'player' | 'team' | 'staff';
export type RecommendationTargetType = 'player' | 'team';
export type RecommendationRelationship = 'teammate' | 'coach' | 'recruiter' | 'manager' | 'partner' | 'staff';

@Entity('recommendations')
@Index(['targetType', 'targetProfile'])
@Index(['targetType', 'targetTeam'])
@Index(['authorType', 'authorProfile'])
@Index(['authorType', 'authorTeam'])
@Index(['authorType', 'authorProfile', 'targetType', 'targetProfile'], { unique: true })
export class RecommendationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  targetType!: RecommendationTargetType;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_profile_id' })
  targetProfile!: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_team_id' })
  targetTeam!: TeamEntity | null;

  @Column({ type: 'varchar', length: 20 })
  authorType!: RecommendationAuthorType;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_profile_id' })
  authorProfile!: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_team_id' })
  authorTeam!: TeamEntity | null;

  @Column({ type: 'varchar', length: 255 })
  authorDisplayName!: string;

  @Column({ type: 'varchar', length: 255 })
  authorSlug!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  authorAvatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gameSlug!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gameName!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  gameIconUrl!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  role!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relationship!: RecommendationRelationship | null;

  @Column({ type: 'simple-json' })
  tags!: string[];

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'int', nullable: true })
  rating!: number | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'helpful_count', type: 'int', unsigned: true, default: 0 })
  helpfulCount!: number;

  @Column({ type: 'text', nullable: true })
  replyContent!: string | null;

  @Column({ name: 'reply_created_at', type: 'datetime', nullable: true })
  replyCreatedAt!: Date | null;
}
