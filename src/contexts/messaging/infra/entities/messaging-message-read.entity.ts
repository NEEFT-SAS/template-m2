import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { MessagingMessageEntity } from './messaging-message.entity';

@Entity('messaging_message_reads')
@Unique(['message', 'readerProfile'])
export class MessagingMessageReadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MessagingMessageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message!: MessagingMessageEntity;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reader_profile_id' })
  readerProfile!: UserProfileEntity;

  @CreateDateColumn({ name: 'read_at', type: 'datetime', precision: 6 })
  readAt!: Date;
}
