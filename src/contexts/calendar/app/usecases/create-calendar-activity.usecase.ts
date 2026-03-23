import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { CALENDAR_REPOSITORY, CalendarRepositoryPort } from '../ports/calendar.repository.port';
import { CreateCalendarActivityDTO } from '../../api/dtos/create-calendar-activity.dto';
import { CalendarForbiddenError, CalendarTeamNotFoundError } from '../../domain/errors/calendar.errors';
import { CalendarActivityCreatedEvent } from '../../domain/events/calendar-activity-created.event';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';

@Injectable()
export class CreateCalendarActivityUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY) private readonly repo: CalendarRepositoryPort,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(teamSlug: string, requesterProfileId: string, dto: CreateCalendarActivityDTO) {
    const teamId = await this.repo.findTeamIdBySlug(teamSlug);
    if (!teamId) {
      throw new CalendarTeamNotFoundError(teamSlug);
    }

    const access = await this.repo.findTeamAccess(teamId, requesterProfileId);
    if (!access.exists) {
      throw new CalendarTeamNotFoundError(teamSlug);
    }

    const canManage = access.isOwner || (access.membershipPermissions & TEAM_MEMBER_PERMISSIONS.MANAGE_CALENDAR) === TEAM_MEMBER_PERMISSIONS.MANAGE_CALENDAR;
    if (!canManage) {
      throw new CalendarForbiddenError(teamId);
    }

    const targetMembers = await this.repo.listTeamMembersWithEmails(teamId, dto.assignedProfileIds);

    const profileAssignments = targetMembers.map((member) => ({
      targetType: 'PLAYER' as const,
      profileId: member.profileId,
      memberId: member.memberId,
      status: dto.assignedProfilesStatus ?? 'ACCEPTED',
    }));

    const teamAssignments = (dto.assignedTeams ?? []).map((team) => ({
      targetType: 'TEAM' as const,
      profileId: null,
      memberId: null,
      targetTeamId: team.teamId ?? null,
      targetTeamName: team.teamName ?? null,
      selectedScrimmerProfileId: team.selectedScrimmerProfileId ?? null,
      status: team.status ?? 'PENDING',
    }));

    const created = await this.repo.createActivityWithAssignments(
      {
        teamId,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        category: dto.category ?? 'EVENT',
        visibility: dto.visibility ?? 'PUBLIC',
        status: 'CONFIRMED',
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        createdByProfileId: requesterProfileId,
      },
      [...profileAssignments, ...teamAssignments],
    );

    await this.eventBus.publish(
      CalendarActivityCreatedEvent.create({
        activityId: created.id,
        teamId,
        title: created.title,
        type: created.type,
        visibility: created.visibility,
        startsAt: created.startsAt,
        endsAt: created.endsAt,
        recipientEmails: targetMembers.map((member) => member.email),
      }),
    );

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      type: created.type,
      category: created.category,
      visibility: created.visibility,
      status: created.status,
      startsAt: created.startsAt,
      endsAt: created.endsAt,
      teamId: created.teamId,
      assignments: created.assignments?.map((assignment) => ({
        id: assignment.id,
        profileId: assignment.profileId,
        targetType: assignment.targetType,
        team: assignment.targetTeam
          ? {
              id: assignment.targetTeam.id,
              name: assignment.targetTeam.name ?? null,
              slug: assignment.targetTeam.slug ?? null,
              logoPicture: assignment.targetTeam.logoPicture ?? null,
            }
          : (assignment.targetTeamName
              ? {
                  id: assignment.targetTeamId ?? null,
                  name: assignment.targetTeamName,
                  slug: null,
                  logoPicture: null,
                }
              : null),
        selectedScrimmer: assignment.selectedScrimmerProfile
          ? {
              id: assignment.selectedScrimmerProfile.id,
              username: assignment.selectedScrimmerProfile.username ?? null,
              slug: assignment.selectedScrimmerProfile.slug ?? null,
              profilePicture: assignment.selectedScrimmerProfile.profilePicture ?? null,
            }
          : null,
        status: assignment.status,
      })) ?? [],
    };
  }
}
