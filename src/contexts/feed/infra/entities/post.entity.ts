import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { PostMediaEntity } from './post-media.entity';
import { PostLikeEntity } from './post-like.entity';
import { PostCommentEntity } from './post-comment.entity';

export const POST_AUTHOR_TYPES = ['PLAYER', 'TEAM'] as const;
export type PostAuthorType = (typeof POST_AUTHOR_TYPES)[number];

export const POST_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

@Entity('feed_posts')
@Index(['authorPlayer', 'status', 'publishedAt'])
@Index(['authorTeam', 'status', 'publishedAt'])
@Index(['status', 'publishedAt'])
@Index(['isFeatured', 'publishedAt'])
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_player_id' })
  authorPlayer?: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_team_id' })
  authorTeam?: TeamEntity | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: POST_STATUSES,
    enumName: 'feed_post_status_enum',
    default: 'PUBLISHED',
  })
  status!: PostStatus;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  likesCount!: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  commentsCount!: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  viewsCount!: number;

  @Column({ type: 'float', default: 0 })
  engagementScore!: number;

  @Column({ name: 'game_id', type: 'int', nullable: true })
  gameId!: number | null;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @OneToMany(() => PostMediaEntity, (media) => media.post, { cascade: true })
  medias?: PostMediaEntity[];

  @OneToMany(() => PostLikeEntity, (like) => like.post)
  likes?: PostLikeEntity[];

  @OneToMany(() => PostCommentEntity, (comment) => comment.post)
  comments?: PostCommentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
