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
import {
  MESSAGING_ENTITY_TYPES,
  MESSAGING_MESSAGE_SENDER_TYPES,
  MessagingEntityType,
  MessagingMessageSenderType,
} from '../../domain/types/messaging.types';
import { MessagingMessageEntity } from './messaging-message.entity';

@Entity('messaging_conversations')
@Index(['conversationKey'], { unique: true })
export class MessagingConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_key', type: 'varchar', length: 255 })
  conversationKey!: string;

  @Column({
    name: 'participant_a_type',
    type: 'enum',
    enum: MESSAGING_ENTITY_TYPES,
    enumName: 'messaging_entity_type_enum',
  })
  participantAType!: MessagingEntityType;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_a_player_id' })
  participantAPlayer?: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_a_team_id' })
  participantATeam?: TeamEntity | null;

  @Column({
    name: 'participant_b_type',
    type: 'enum',
    enum: MESSAGING_ENTITY_TYPES,
    enumName: 'messaging_entity_type_enum',
  })
  participantBType!: MessagingEntityType;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_b_player_id' })
  participantBPlayer?: UserProfileEntity | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_b_team_id' })
  participantBTeam?: TeamEntity | null;

  @Column({ name: 'last_message_preview', type: 'varchar', length: 500, nullable: true })
  lastMessagePreview!: string | null;

  @Column({
    name: 'last_message_sender_type',
    type: 'enum',
    enum: MESSAGING_MESSAGE_SENDER_TYPES,
    enumName: 'messaging_message_sender_type_enum',
    nullable: true,
  })
  lastMessageSenderType!: MessagingMessageSenderType | null;

  @Column({ name: 'last_message_sender_profile_id', type: 'uuid', nullable: true })
  lastMessageSenderProfileId!: string | null;

  @Column({ name: 'last_message_sender_system_key', type: 'varchar', length: 64, nullable: true })
  lastMessageSenderSystemKey!: string | null;

  @Column({ name: 'last_message_at', type: 'datetime', precision: 6, nullable: true })
  lastMessageAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => MessagingMessageEntity, (message) => message.conversation)
  messages?: MessagingMessageEntity[];
}
