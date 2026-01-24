import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rsc_ranks')
export class RscRankEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug!: string;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'varchar', length: 50 })
  division!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tier!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
