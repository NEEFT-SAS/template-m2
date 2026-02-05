import { TeamOrganizationType, TEAM_ORGANIZATION_TYPES } from '@neeft-sas/shared';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { RscCountryEntity } from '@/contexts/resources/infra/persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from '@/contexts/resources/infra/persistence/entities/rsc-languages.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TeamMemberEntity } from './team-member.entity';
import { TeamRosterEntity } from './team-roster.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 4 })
  acronym!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({
    name: 'organization_type',
    type: 'enum',
    enum: TEAM_ORGANIZATION_TYPES,
    enumName: 'team_organization_type_enum',
    default: 'ASSOCIATION',
  })
  organizationType!: TeamOrganizationType;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  quote!: string | null;

  @Column({ name: 'banner_picture', type: 'varchar', length: 2048, nullable: true })
  bannerPicture!: string | null;

  @Column({ name: 'logo_picture', type: 'varchar', length: 2048, nullable: true })
  logoPicture!: string | null;

  @Column({ name: 'founded_at', type: 'date', nullable: true })
  foundedAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city!: string | null;

  @Column({ type: 'boolean', default: false })
  affiliated!: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'completeness_score', type: 'int', unsigned: true, default: 0 })
  completenessScore!: number;

  @Column({ name: 'trust_score', type: 'int', unsigned: true, default: 0 })
  trustScore!: number;

  @Column({ name: 'stripe_account_id', type: 'varchar', length: 255, nullable: true })
  stripeAccountId!: string | null;

  @ManyToOne(() => RscCountryEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'country_id' })
  country!: RscCountryEntity | null;

  @ManyToOne(() => UserProfileEntity, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_profile_id' })
  owner!: UserProfileEntity;

  @ManyToMany(() => RscLanguageEntity, { eager: true })
  @JoinTable({
    name: 'team_languages',
    joinColumn: { name: 'team_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'language_id', referencedColumnName: 'id' },
  })
  languages!: RscLanguageEntity[];

  @OneToMany(() => TeamMemberEntity, (member) => member.team)
  members?: TeamMemberEntity[];

  @OneToMany(() => TeamRosterEntity, (roster) => roster.team)
  rosters?: TeamRosterEntity[];

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
