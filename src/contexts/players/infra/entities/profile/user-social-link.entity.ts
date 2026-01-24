import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

@Entity('user_social_links')
@Unique('uq_user_social_links_profile_platform', ['userProfile', 'rscSocialPlatformId'])
export class UserSocialLinkEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'platform_id' })
  rscSocialPlatformId!: number;

 @Column({ type: 'varchar', length: 120 })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  url!: string;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @Index()
  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile!: UserProfileEntity;
}
