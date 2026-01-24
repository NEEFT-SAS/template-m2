import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rsc_platforms')
export class RscPlatformEntity {
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
