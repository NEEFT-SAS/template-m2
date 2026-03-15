import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RscStaffOptionGroupEntity } from './rsc-staff-option-group.entity';
import { RscStaffOptionEntity } from './rsc-staff-option.entity';

@Entity('rsc_staff_group_options')
@Index(['groupId', 'optionId'], { unique: true })
export class RscStaffGroupOptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'group_id', type: 'int' })
  groupId!: number;

  @Column({ name: 'option_id', type: 'int' })
  optionId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscStaffOptionGroupEntity, (group) => group.groupOptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group!: RscStaffOptionGroupEntity;

  @ManyToOne(() => RscStaffOptionEntity, (option) => option.groupLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'option_id' })
  option!: RscStaffOptionEntity;
}
