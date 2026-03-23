import {
  CalendarAssignmentStatus,
  CalendarAssignmentTargetType,
  CalendarActivityCategory,
  CalendarActivityStatus,
  CalendarActivityType,
  CalendarActivityVisibility,
} from '../../domain/types/calendar.types';
import type { CalendarActivityEntity } from '../../infra/entities/calendar-activity.entity';

export const CALENDAR_REPOSITORY = Symbol('CALENDAR_REPOSITORY');

export type CalendarTeamAccess = {
  exists: boolean;
  isOwner: boolean;
  membershipPermissions: bigint;
  memberId: string | null;
};

export type TeamMemberEmailTarget = {
  profileId: string;
  memberId: string;
  email: string;
};

export type CreateCalendarActivityInput = {
  teamId: string;
  title: string;
  description?: string | null;
  type: CalendarActivityType;
  category: CalendarActivityCategory;
  visibility: CalendarActivityVisibility;
  status: CalendarActivityStatus;
  startsAt: Date;
  endsAt: Date;
  createdByProfileId: string;
};

export type CreateCalendarAssignmentInput = {
  targetType: CalendarAssignmentTargetType;
  profileId?: string | null;
  targetTeamId?: string | null;
  targetTeamName?: string | null;
  selectedScrimmerProfileId?: string | null;
  memberId: string | null;
  status: CalendarAssignmentStatus;
};

export type ListActivitiesInput = {
  teamId: string;
  viewerProfileId?: string;
  includePrivateForManager?: boolean;
  visibility?: 'PUBLIC' | 'ALL';
  from?: Date;
  to?: Date;
};

export interface CalendarRepositoryPort {
  findTeamIdBySlug(slug: string): Promise<string | null>;
  findTeamAccess(teamId: string, profileId: string): Promise<CalendarTeamAccess>;
  listTeamMembersWithEmails(teamId: string, profileIds?: string[]): Promise<TeamMemberEmailTarget[]>;
  createActivityWithAssignments(
    activity: CreateCalendarActivityInput,
    assignments: CreateCalendarAssignmentInput[],
  ): Promise<CalendarActivityEntity>;
  listActivities(input: ListActivitiesInput): Promise<CalendarActivityEntity[]>;
}
