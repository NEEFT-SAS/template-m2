import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import {
  CALENDAR_ACTIVITY_CATEGORIES,
  CALENDAR_ACTIVITY_STATUSES,
  CALENDAR_ACTIVITY_TYPES,
  CALENDAR_ACTIVITY_VISIBILITIES,
  CalendarActivityCategory,
  CalendarActivityStatus,
  CalendarActivityType,
  CalendarActivityVisibility,
} from '../../domain/types/calendar.types';
import { CalendarActivityAssignmentEntity } from './calendar-activity-assignment.entity';

@Entity('calendar_activities')
export class CalendarActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @RelationId((activity: CalendarActivityEntity) => activity.team)
  teamId!: string;

  @Column({ type: 'varchar', length: 140 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'activity_type',
    type: 'enum',
    enum: CALENDAR_ACTIVITY_TYPES,
    enumName: 'calendar_activity_type_enum',
  })
  type!: CalendarActivityType;

  @Column({
    name: 'activity_category',
    type: 'enum',
    enum: CALENDAR_ACTIVITY_CATEGORIES,
    enumName: 'calendar_activity_category_enum',
    default: 'EVENT',
  })
  category!: CalendarActivityCategory;

  @Column({
    type: 'enum',
    enum: CALENDAR_ACTIVITY_VISIBILITIES,
    enumName: 'calendar_activity_visibility_enum',
    default: 'PUBLIC',
  })
  visibility!: CalendarActivityVisibility;

  @Column({
    type: 'enum',
    enum: CALENDAR_ACTIVITY_STATUSES,
    enumName: 'calendar_activity_status_enum',
    default: 'CONFIRMED',
  })
  status!: CalendarActivityStatus;

  @Index('IDX_calendar_activities_starts_at')
  @Column({ name: 'starts_at', type: 'datetime' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'datetime' })
  endsAt!: Date;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_profile_id' })
  createdBy!: UserProfileEntity;

  @RelationId((activity: CalendarActivityEntity) => activity.createdBy)
  createdByProfileId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => CalendarActivityAssignmentEntity, (assignment) => assignment.activity, { cascade: true })
  assignments?: CalendarActivityAssignmentEntity[];
}
