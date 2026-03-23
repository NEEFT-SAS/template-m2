import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CalendarRepositoryPort,
  CalendarTeamAccess,
  CreateCalendarActivityInput,
  CreateCalendarAssignmentInput,
  ListActivitiesInput,
  TeamMemberEmailTarget,
} from '../../../app/ports/calendar.repository.port';
import { CalendarActivityAssignmentEntity } from '../../entities/calendar-activity-assignment.entity';
import { CalendarActivityEntity } from '../../entities/calendar-activity.entity';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';

@Injectable()
export class CalendarRepositoryTypeorm implements CalendarRepositoryPort {
  constructor(
    @InjectRepository(CalendarActivityEntity) private readonly activityRepo: Repository<CalendarActivityEntity>,
    @InjectRepository(CalendarActivityAssignmentEntity) private readonly assignmentRepo: Repository<CalendarActivityAssignmentEntity>,
    @InjectRepository(TeamEntity) private readonly teamRepo: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity) private readonly teamMemberRepo: Repository<TeamMemberEntity>,
  ) {}

  async findTeamIdBySlug(slug: string): Promise<string | null> {
    const team = await this.teamRepo
      .createQueryBuilder('team')
      .select(['team.id'])
      .where('LOWER(team.slug) = LOWER(:slug)', { slug })
      .getOne();
    return team?.id ?? null;
  }

  async findTeamAccess(teamId: string, profileId: string): Promise<CalendarTeamAccess> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['owner'],
    });

    if (!team) {
      return { exists: false, isOwner: false, membershipPermissions: 0n, memberId: null };
    }

    if (team.owner?.id === profileId) {
      return { exists: true, isOwner: true, membershipPermissions: TEAM_MEMBER_PERMISSIONS.MANAGE_CALENDAR, memberId: null };
    }

    const membership = await this.teamMemberRepo.findOne({
      where: { team: { id: teamId }, profile: { id: profileId } },
    });

    return {
      exists: true,
      isOwner: false,
      membershipPermissions: membership?.permissions ?? 0n,
      memberId: membership?.id ?? null,
    };
  }

  async listTeamMembersWithEmails(teamId: string, profileIds?: string[]): Promise<TeamMemberEmailTarget[]> {
    const query = this.teamMemberRepo
      .createQueryBuilder('member')
      .innerJoin('member.profile', 'profile')
      .innerJoin(UserCredentialsEntity, 'credentials', 'credentials.id = profile.userCredentialId')
      .where('member.team_id = :teamId', { teamId })
      .select([
        'member.id AS memberId',
        'profile.id AS profileId',
        'credentials.email AS email',
      ]);

    if (profileIds && profileIds.length > 0) {
      query.andWhere('profile.id IN (:...profileIds)', { profileIds });
    }

    const rows = await query.getRawMany<{ memberId: string; profileId: string; email: string }>();
    return rows.map((row) => ({
      memberId: row.memberId,
      profileId: row.profileId,
      email: row.email,
    }));
  }

  async createActivityWithAssignments(
    activity: CreateCalendarActivityInput,
    assignments: CreateCalendarAssignmentInput[],
  ): Promise<CalendarActivityEntity> {
    const created = this.activityRepo.create({
      team: { id: activity.teamId } as TeamEntity,
      title: activity.title,
      description: activity.description ?? null,
      type: activity.type,
      category: activity.category,
      visibility: activity.visibility,
      status: activity.status,
      startsAt: activity.startsAt,
      endsAt: activity.endsAt,
      createdBy: { id: activity.createdByProfileId } as UserProfileEntity,
      assignments: assignments.map((assignment) =>
        this.assignmentRepo.create({
          targetType: assignment.targetType,
          profile: assignment.profileId ? ({ id: assignment.profileId } as UserProfileEntity) : null,
          targetTeam: assignment.targetTeamId ? ({ id: assignment.targetTeamId } as TeamEntity) : null,
          targetTeamName: assignment.targetTeamName ?? null,
          selectedScrimmerProfile: assignment.selectedScrimmerProfileId
            ? ({ id: assignment.selectedScrimmerProfileId } as UserProfileEntity)
            : null,
          teamMember: assignment.memberId ? ({ id: assignment.memberId } as TeamMemberEntity) : null,
          status: assignment.status,
        }),
      ),
    });

    const saved = await this.activityRepo.save(created);
    const reloaded = await this.activityRepo.findOne({
      where: { id: saved.id },
      relations: ['assignments', 'assignments.profile', 'assignments.targetTeam', 'assignments.selectedScrimmerProfile'],
    });

    return reloaded ?? saved;
  }

  async listActivities(input: ListActivitiesInput): Promise<CalendarActivityEntity[]> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.assignments', 'assignment')
      .leftJoinAndSelect('assignment.profile', 'profile')
      .leftJoinAndSelect('assignment.targetTeam', 'targetTeam')
      .leftJoinAndSelect('assignment.selectedScrimmerProfile', 'selectedScrimmerProfile')
      .where('activity.team_id = :teamId', { teamId: input.teamId });

    if (input.from) {
      qb.andWhere('activity.starts_at >= :from', { from: input.from });
    }
    if (input.to) {
      qb.andWhere('activity.ends_at <= :to', { to: input.to });
    }

    if (input.visibility === 'PUBLIC') {
      qb.andWhere('activity.visibility = :visibilityFilter', { visibilityFilter: 'PUBLIC' });
    }

    if (!input.viewerProfileId) {
      qb.andWhere('activity.visibility = :publicVisibility', { publicVisibility: 'PUBLIC' });
    } else if (!input.includePrivateForManager) {
      qb.andWhere(
        '(activity.visibility = :publicVisibility OR (activity.visibility = :privateVisibility AND assignment.profile_id = :viewerProfileId))',
        { publicVisibility: 'PUBLIC', privateVisibility: 'PRIVATE', viewerProfileId: input.viewerProfileId },
      );
    }

    qb.orderBy('activity.starts_at', 'ASC');
    return qb.getMany();
  }
}
