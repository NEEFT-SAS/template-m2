import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { NotificationType } from '../../domain/types/notification.types';

@Entity('notifications')
@Index(['recipientProfile', 'createdAt'])
@Index(['recipientProfile', 'readAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_profile_id' })
  recipientProfile!: UserProfileEntity;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_profile_id' })
  actorProfile!: UserProfileEntity | null;

  @Column({ type: 'varchar', length: 80 })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  body!: string | null;

  @Column({ type: 'json', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ name: 'context_conversation_id', type: 'uuid', nullable: true })
  contextConversationId!: string | null;

  @Column({ name: 'context_message_id', type: 'uuid', nullable: true })
  contextMessageId!: string | null;

  @Column({ name: 'read_at', type: 'datetime', precision: 6, nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
