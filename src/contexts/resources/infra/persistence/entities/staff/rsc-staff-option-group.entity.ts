import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RscStaffGroupOptionEntity } from './rsc-staff-group-option.entity';
import { RscStaffRoleOptionLinkEntity } from './rsc-staff-role-option-link.entity';

export const RSC_STAFF_OPTION_GROUP_SOURCE_TYPES = [
  'STATIC',
  'LANGUAGES',
  'GAMES',
] as const;

export type RscStaffOptionGroupSourceType =
  (typeof RSC_STAFF_OPTION_GROUP_SOURCE_TYPES)[number];

@Entity('rsc_staff_option_groups')
export class RscStaffOptionGroupEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  key!: string;

  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: RSC_STAFF_OPTION_GROUP_SOURCE_TYPES,
    default: 'STATIC',
  })
  sourceType!: RscStaffOptionGroupSourceType;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => RscStaffGroupOptionEntity, (groupOption) => groupOption.group)
  groupOptions!: RscStaffGroupOptionEntity[];

  @OneToMany(() => RscStaffRoleOptionLinkEntity, (link) => link.group)
  roleLinks!: RscStaffRoleOptionLinkEntity[];
}
