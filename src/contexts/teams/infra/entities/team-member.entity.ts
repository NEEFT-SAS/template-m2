import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, Unique, UpdateDateColumn } from 'typeorm';
import { TeamMemberRole, TEAM_MEMBER_ROLES } from '@neeft-sas/shared';
import { TeamEntity } from './team.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamRosterMemberEntity } from './team-roster-member.entity';

@Entity('team_members')
@Unique(['team', 'profile'])
export class TeamMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TeamEntity, (team) => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @RelationId((member: TeamMemberEntity) => member.team)
  teamId!: string;

  @ManyToOne(() => UserProfileEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: UserProfileEntity;

  @RelationId((member: TeamMemberEntity) => member.profile)
  profileId!: string;

  @Column({
    type: 'enum',
    enum: TEAM_MEMBER_ROLES,
    enumName: 'team_member_role_enum',
    nullable: true,
  })
  role?: TeamMemberRole | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string | null;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden!: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  permissions!: bigint;

  @Column({name: "status", enum: ['current', 'former'], type: "enum", nullable: true})
  status?: 'current' | 'former' | null;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @OneToMany(() => TeamRosterMemberEntity, (rosterMember) => rosterMember.member)
  rosterMemberships?: TeamRosterMemberEntity[];
}
