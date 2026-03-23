import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscStaffEntity } from './rsc-staffs.entity';

@Entity('rsc_staff_categories')
export class RscStaffCategoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string | null;  

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
