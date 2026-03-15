import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RscStaffRoleEntity } from './rsc-staff-role.entity';
import { RscStaffOptionGroupEntity } from './rsc-staff-option-group.entity';
import { RscStaffOptionEntity } from './rsc-staff-option.entity';

@Entity('rsc_staff_role_option_links')
@Index(['roleId', 'groupId'])
@Index(['roleId', 'groupId', 'optionId'])
export class RscStaffRoleOptionLinkEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'role_id', type: 'int' })
  roleId!: number;

  @Column({ name: 'group_id', type: 'int' })
  groupId!: number;

  @Column({ name: 'option_id', type: 'int', nullable: true })
  optionId!: number | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscStaffRoleEntity, (role) => role.optionLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RscStaffRoleEntity;

  @ManyToOne(() => RscStaffOptionGroupEntity, (group) => group.roleLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group!: RscStaffOptionGroupEntity;

  @ManyToOne(() => RscStaffOptionEntity, (option) => option.roleLinks, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'option_id' })
  option!: RscStaffOptionEntity | null;
}
