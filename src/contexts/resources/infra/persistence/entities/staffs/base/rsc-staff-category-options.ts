import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscStaffCategoryEntity } from './rsc-staff-categories.entity';
import { RscStaffEntity } from './rsc-staffs.entity';

@Entity('rsc_staff_category_options')
export class RscStaffCategoryOptionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string | null;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId!: number | null;

  @ManyToOne(() => RscStaffCategoryEntity, (category) => category.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: RscStaffCategoryEntity;

  @Column({ name: 'staff_id', type: 'int', nullable: true })
  staffId!: number | null;

  @ManyToOne(() => RscStaffEntity, (staff) => staff.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'staff_id' })
  staff!: RscStaffEntity | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
