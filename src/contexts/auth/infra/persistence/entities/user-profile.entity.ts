import { BillingPlanKeyEnum } from '@/contexts/billing/infra/entitlements/billing-plans.registry';
import { RscCountryEntity } from '@/contexts/resources/infra/persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from '@/contexts/resources/infra/persistence/entities/rsc-languages.entity';
import { UserProfileGenderEnum } from '@/contexts/auth/domain/types/user-profile-gender.enum';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'user_credential_id', type: 'uuid', select: false })
  userCredentialId!: string;

  @Column({ type: 'varchar', length: 20 })
  username!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 25 })
  slug!: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: Date;
  
  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  firstname!: string;

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  lastname!: string;

  @Column({
    type: 'enum',
    enum: UserProfileGenderEnum,
    default: UserProfileGenderEnum.OTHER,
  })
  gender!: UserProfileGenderEnum;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  // description
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  citation!: string | null;

  @Column({ name: 'profile_picture', type: 'varchar', length: 255, nullable: true })
  profilePicture!: string | null;

  @Column({ name: 'banner_picture', type: 'varchar', length: 255, nullable: true })
  bannerPicture!: string | null;

  @Column({ name: 'work_sector', type: 'varchar', length: 255, nullable: true })
  workSector!: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 255, nullable: true })
  contractType!: string | null;

  @Column({ name: 'is_disabled_player', type: 'boolean', nullable: true })
  isDisabledPlayer!: boolean | null;

  @Index({ unique: true })
  @Column({ name: 'referral_code', type: 'varchar', length: 32 })
  referralCode!: string;

  @Column({ name: 'referred_by_user_id', type: 'uuid', nullable: true, select: false })
  referredByUserId!: string | null;

  @Index({ unique: true })
  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255, nullable: true, select: false })
  stripeCustomerId!: string | null;

  @Column({
    name: 'billing_plan_key',
    type: 'enum',
    enum: BillingPlanKeyEnum,
    default: BillingPlanKeyEnum.FREE,
  })
  billingPlanKey!: BillingPlanKeyEnum;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @ManyToOne(() => RscCountryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'nationality_id' })
  nationality!: RscCountryEntity | null;

  @ManyToMany(() => RscLanguageEntity)
  @JoinTable({
    name: 'user_profile_languages',
    joinColumn: { name: 'user_profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'language_id', referencedColumnName: 'id' },
  })
  languages!: RscLanguageEntity[];
}
