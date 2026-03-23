import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import {
  CALENDAR_ASSIGNMENT_STATUSES,
  CALENDAR_ASSIGNMENT_TARGET_TYPES,
  CalendarAssignmentStatus,
  CalendarAssignmentTargetType,
} from '../../domain/types/calendar.types';
import { CalendarActivityEntity } from './calendar-activity.entity';

@Entity('calendar_activity_assignments')
export class CalendarActivityAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CalendarActivityEntity, (activity) => activity.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity!: CalendarActivityEntity;

  @RelationId((assignment: CalendarActivityAssignmentEntity) => assignment.activity)
  activityId!: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: CALENDAR_ASSIGNMENT_TARGET_TYPES,
    enumName: 'calendar_assignment_target_type_enum',
    default: 'PLAYER',
  })
  targetType!: CalendarAssignmentTargetType;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_id' })
  profile!: UserProfileEntity | null;

  @RelationId((assignment: CalendarActivityAssignmentEntity) => assignment.profile)
  profileId!: string | null;

  @ManyToOne(() => TeamEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_team_id' })
  targetTeam!: TeamEntity | null;

  @RelationId((assignment: CalendarActivityAssignmentEntity) => assignment.targetTeam)
  targetTeamId!: string | null;

  @Column({ name: 'target_team_name', type: 'varchar', length: 255, nullable: true })
  targetTeamName!: string | null;

  @ManyToOne(() => UserProfileEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'selected_scrimmer_profile_id' })
  selectedScrimmerProfile!: UserProfileEntity | null;

  @RelationId((assignment: CalendarActivityAssignmentEntity) => assignment.selectedScrimmerProfile)
  selectedScrimmerProfileId!: string | null;

  @ManyToOne(() => TeamMemberEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_member_id' })
  teamMember!: TeamMemberEntity | null;

  @RelationId((assignment: CalendarActivityAssignmentEntity) => assignment.teamMember)
  teamMemberId!: string | null;

  @Column({
    name: 'assignment_status',
    type: 'enum',
    enum: CALENDAR_ASSIGNMENT_STATUSES,
    enumName: 'calendar_assignment_status_enum',
    default: 'PENDING',
  })
  status!: CalendarAssignmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
