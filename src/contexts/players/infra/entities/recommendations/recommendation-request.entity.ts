import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';

export type RecommendationRequestStatus = 'pending' | 'accepted' | 'declined';

@Entity('recommendation_requests')
@Index(['targetType', 'targetProfile'])
@Index(['targetType', 'targetTeam'])
export class RecommendationRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  targetType!: 'player' | 'team';

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_profile_id' })
  targetProfile!: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_team_id' })
  targetTeam!: TeamEntity | null;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_profile_id' })
  requesterProfile!: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_team_id' })
  requesterTeam!: TeamEntity | null;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_profile_id' })
  recipientProfile!: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_team_id' })
  recipientTeam!: TeamEntity | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contextGameSlug!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contextRole!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contextPeriodLabel!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: RecommendationRequestStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
