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

@Entity('rsc_staff_options')
@Index(['key'], { unique: true })
export class RscStaffOptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 80 })
  key!: string;

  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  slug!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  icon!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => RscStaffGroupOptionEntity, (groupOption) => groupOption.option)
  groupLinks!: RscStaffGroupOptionEntity[];

  @OneToMany(() => RscStaffRoleOptionLinkEntity, (link) => link.option)
  roleLinks!: RscStaffRoleOptionLinkEntity[];
}
