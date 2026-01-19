import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RscSocialPlatformTypeEnum } from '@neeft-sas/shared';

@Entity('rsc_social_platforms')
export class RscSocialPlatformEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  key!: string; // ex: twitch, twitter, instagram

  @Column({ type: 'varchar', length: 80 })
  label!: string; // ex: Twitch, X (Twitter)

  @Column({ name: 'base_url', type: 'varchar', length: 255, nullable: true })
  baseUrl!: string | null; // ex: https://twitch.tv/

  @Column({ type: 'varchar', length: 30 })
  type!: RscSocialPlatformTypeEnum; // username | url | handle

  @Column({ type: 'varchar', length: 80, nullable: true })
  placeholder!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  example!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  icon!: string | null; // iconify name ex: uil:twitch

  @Column({ name: 'is_active', type: 'boolean', default: true, select: false })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}