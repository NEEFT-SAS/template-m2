import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RscBadgeScope } from '@neeft-sas/shared'

@Entity('rsc_profile_badges')
export class RscProfileBadgeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  key!: string; // ex: "new_user", "verified", "staff_neeft"

  @Column({ type: 'varchar', length: 80 })
  label!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string | null;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({ type: 'enum', enum: RscBadgeScope, default: RscBadgeScope.BOTH })
  scope!: RscBadgeScope;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
