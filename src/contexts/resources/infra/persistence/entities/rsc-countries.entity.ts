import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rsc_countries')
export class RscCountryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 2 })
  code!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 3 })
  code3!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'i18n_name', type: 'varchar', length: 80 })
  i18nName!: string;

  @Column({ name: 'flag_icon', type: 'varchar', length: 255, nullable: true })
  flagIcon!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
