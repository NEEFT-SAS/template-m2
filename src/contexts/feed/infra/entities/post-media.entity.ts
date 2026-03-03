import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';

export const MEDIA_TYPES = ['IMAGE', 'VIDEO'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

@Entity('feed_post_medias')
export class PostMediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PostEntity, (post) => post.medias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: PostEntity;

  @Column({
    type: 'enum',
    enum: MEDIA_TYPES,
    enumName: 'feed_post_media_type_enum',
  })
  type!: MediaType;

  @Column({ type: 'varchar', length: 2048 })
  url!: string;

  @Column({ name: 'display_order', type: 'smallint', default: 0 })
  displayOrder!: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  width?: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  height?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
