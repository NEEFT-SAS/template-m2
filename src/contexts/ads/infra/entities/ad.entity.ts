import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AdType = 'banner' | 'sidebar';
export type AdDisplayMode = 'cover' | 'fit';

@Entity('ads')
export class AdEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  imgUrl: string;

  @Column()
  link: string;

  @Column({ type: 'smallint', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  @Index('idx_ads_is_active')
  isActive: boolean;

  @Column({ type: 'enum', enum: ['banner', 'sidebar'], default: 'banner' })
  @Index('idx_ads_type')
  type: AdType;

  @Column({ type: 'enum', enum: ['cover', 'fit'], default: 'fit' })
  displayMode: AdDisplayMode;

  @Column({ type: 'date' })
  @Index('idx_ads_expiration_date')
  expirationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
