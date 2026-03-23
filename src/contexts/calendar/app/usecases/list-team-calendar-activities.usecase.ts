import { Inject, Injectable } from '@nestjs/common';
import { CALENDAR_REPOSITORY, CalendarRepositoryPort } from '../ports/calendar.repository.port';
import { CalendarTeamNotFoundError } from '../../domain/errors/calendar.errors';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';

@Injectable()
export class ListTeamCalendarActivitiesUseCase {
  constructor(
    @Inject(CALENDAR_REPOSITORY) private readonly repo: CalendarRepositoryPort,
  ) {}

  async executePublic(teamSlug: string, from?: Date, to?: Date, visibility: 'PUBLIC' | 'ALL' = 'PUBLIC') {
    const teamId = await this.repo.findTeamIdBySlug(teamSlug);
    if (!teamId) {
      throw new CalendarTeamNotFoundError(teamSlug);
    }

    const rows = await this.repo.listActivities({ teamId, from, to, visibility: visibility === 'ALL' ? 'PUBLIC' : visibility });
    return rows.map((row) => this.toPresenter(row));
  }

  async executeForMember(
    teamSlug: string,
    requesterProfileId: string,
    from?: Date,
    to?: Date,
    visibility: 'PUBLIC' | 'ALL' = 'ALL',
  ) {
    const teamId = await this.repo.findTeamIdBySlug(teamSlug);
    if (!teamId) {
      throw new CalendarTeamNotFoundError(teamSlug);
    }

    const access = await this.repo.findTeamAccess(teamId, requesterProfileId);
    if (!access.exists) {
      throw new CalendarTeamNotFoundError(teamSlug);
    }

    const includePrivateForManager =
      access.isOwner || (access.membershipPermissions & TEAM_MEMBER_PERMISSIONS.MANAGE_CALENDAR) === TEAM_MEMBER_PERMISSIONS.MANAGE_CALENDAR;

    const rows = await this.repo.listActivities({
      teamId,
      viewerProfileId: requesterProfileId,
      includePrivateForManager,
      visibility,
      from,
      to,
    });

    return rows.map((row) => this.toPresenter(row));
  }

  private toPresenter(row: any) {
    return {
      id: row.id,
      teamId: row.teamId,
      createdByProfileId: row.createdByProfileId ?? null,
      title: row.title,
      description: row.description,
      type: row.type,
      category: row.category,
      visibility: row.visibility,
      status: row.status,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      assignments: row.assignments?.map((assignment: any) => ({
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
        profile: assignment.profile
          ? {
              id: assignment.profile.id,
              username: assignment.profile.username ?? null,
              slug: assignment.profile.slug ?? null,
              profilePicture: assignment.profile.profilePicture ?? null,
            }
          : null,
      })) ?? [],
    };
  }
}
