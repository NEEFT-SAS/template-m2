import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

const LANGUAGE_DIRECTIONS = ['ltr', 'rtl'] as const;
type LanguageDirection = (typeof LANGUAGE_DIRECTIONS)[number];

@Entity('rsc_languages')
export class RscLanguageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 2 })
  code!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  locale!: string | null;

  @Column({ type: 'varchar', length: 80 })
  label!: string;

  @Column({ name: 'i18n_name', type: 'varchar', length: 80 })
  i18nName!: string;

  @Column({ type: 'enum', enum: LANGUAGE_DIRECTIONS, default: 'ltr' })
  direction!: LanguageDirection;

  @Column({ name: 'flag_icon', type: 'varchar', length: 255, nullable: true })
  flagIcon!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
