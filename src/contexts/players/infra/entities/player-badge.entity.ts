import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_badges')
@Index(['userProfileId', 'rscBadgeId'], { unique: true })
export class PlayerBadgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_profile_id', type: 'uuid' })
  userProfileId!: string;

  @Column({ name: 'rsc_badge_id', type: 'int' })
  rscBadgeId!: number;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
