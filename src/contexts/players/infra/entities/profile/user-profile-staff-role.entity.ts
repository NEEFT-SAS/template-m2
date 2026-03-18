import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('player_staff_roles')
@Unique('uq_player_staff_roles_profile_role_key', ['profile', 'roleKey'])
export class UserProfileStaffRoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_player_staff_roles_role_key')
  @Column({ name: 'role_key', type: 'varchar', length: 80 })
  roleKey!: string;

  @Column({ type: 'json', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @Index('idx_player_staff_roles_profile_id')
  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: UserProfileEntity;
}
