import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { MessagingConversationEntity } from './messaging-conversation.entity';
import { MessagingMessageReadEntity } from './messaging-message-read.entity';

@Entity('messaging_messages')
export class MessagingMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MessagingConversationEntity, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: MessagingConversationEntity;

  @ManyToOne(() => UserProfileEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_profile_id' })
  senderProfile!: UserProfileEntity;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @OneToMany(() => MessagingMessageReadEntity, (read) => read.message)
  reads?: MessagingMessageReadEntity[];
}
