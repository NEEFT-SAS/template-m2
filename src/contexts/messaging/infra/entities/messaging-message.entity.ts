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
import {
  MESSAGING_MESSAGE_SENDER_TYPES,
  MessagingMessageSenderType,
} from '../../domain/types/messaging.types';
import { MessagingConversationEntity } from './messaging-conversation.entity';
import { MessagingMessageReadEntity } from './messaging-message-read.entity';

@Entity('messaging_messages')
export class MessagingMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MessagingConversationEntity, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: MessagingConversationEntity;

  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: MESSAGING_MESSAGE_SENDER_TYPES,
    enumName: 'messaging_message_sender_type_enum',
  })
  senderType!: MessagingMessageSenderType;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_profile_id' })
  senderProfile!: UserProfileEntity | null;

  @Column({ name: 'sender_system_key', type: 'varchar', length: 64, nullable: true })
  senderSystemKey!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @OneToMany(() => MessagingMessageReadEntity, (read) => read.message)
  reads?: MessagingMessageReadEntity[];
}
