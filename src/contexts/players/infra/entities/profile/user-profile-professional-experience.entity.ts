import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

@Entity('user_profile_professional_experiences')
export class UserProfileProfessionalExperienceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: UserProfileEntity;

  @Column({ type: 'varchar', length: 255 })
  companyName!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  companyLogoUrl!: string | null;

  @Column({ type: 'varchar', length: 255 })
  positionTitle!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contractType!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  missions!: string[] | null;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
