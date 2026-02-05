import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, Unique, UpdateDateColumn } from 'typeorm';
import { TEAM_ROSTER_MEMBER_ROLES, TeamRosterMemberRole } from '@neeft-sas/shared';
import { TeamRosterEntity } from './team-roster.entity';
import { TeamMemberEntity } from './team-member.entity';
import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';

@Entity('team_roster_members')
@Unique(['roster', 'member'])
export class TeamRosterMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TeamRosterEntity, (roster) => roster.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roster_id' })
  roster!: TeamRosterEntity;

  @RelationId((member: TeamRosterMemberEntity) => member.roster)
  rosterId!: string;

  @ManyToOne(() => TeamMemberEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member!: TeamMemberEntity;

  @RelationId((member: TeamRosterMemberEntity) => member.member)
  memberId!: string;

  @Column({
    type: 'enum',
    enum: TEAM_ROSTER_MEMBER_ROLES,
    enumName: 'team_roster_member_role_enum',
    default: 'MEMBER',
  })
  role!: TeamRosterMemberRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string | null;

  @ManyToOne(() => RscPositionEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'position_id' })
  position?: RscPositionEntity | null;

  @RelationId((member: TeamRosterMemberEntity) => member.position)
  positionId?: number | null;

  @Column({ name: 'is_hidden', type: 'boolean', default: false })
  isHidden!: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  permissions!: number;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
