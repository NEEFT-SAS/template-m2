import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';

@Entity('social_follows')
@Unique(['followerPlayer', 'followerTeam', 'followedPlayer', 'followedTeam'])
@Index(['followerPlayer', 'followedPlayer'])
@Index(['followerTeam', 'followedPlayer'])
@Index(['followedPlayer'])
@Index(['followedTeam'])
export class FollowEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_player_id' })
  followerPlayer?: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_team_id' })
  followerTeam?: TeamEntity | null;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followed_player_id' })
  followedPlayer?: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followed_team_id' })
  followedTeam?: TeamEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
