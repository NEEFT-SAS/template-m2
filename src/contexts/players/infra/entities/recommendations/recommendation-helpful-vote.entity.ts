import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RecommendationEntity } from './recommendation.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

@Entity('recommendation_helpful_votes')
@Index(['recommendation', 'viewerProfile'], { unique: true })
export class RecommendationHelpfulVoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RecommendationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recommendation_id' })
  recommendation!: RecommendationEntity;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewer_profile_id' })
  viewerProfile!: UserProfileEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
