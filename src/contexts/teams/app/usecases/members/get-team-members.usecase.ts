import { Inject, Injectable } from '@nestjs/common';
import { TeamMemberPresenter } from '@neeft-sas/shared';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberNotFoundError,
  TeamNotFoundError,
} from '../../../domain/errors/team.errors';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class GetTeamMembersUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
  ) {}

  async execute(teamSlug: string, requesterProfileId: string): Promise<TeamMemberPresenter[]> {
    const team = await this.repo.findTeamBySlug(teamSlug);
    if (!team) {
      throw new TeamNotFoundError(teamSlug);
    }
    const requester = await this.repo.findTeamMemberByProfile(team.id, requesterProfileId);

    const members = await this.repo.findTeamMembersWithProfile(team.id);
    if (!members) {
      throw new TeamMemberNotFoundError(team.id, null);
    }
    const filteredMembers = members.filter(m => {
      if(m.isHidden && !requester) return false; // hidden members are only visible to team members
      if(m.status === 'former' && !requester) return false; // former members are only visible to team members
      if(m.deletedAt != null && !requester) return false; // deleted members are only visible to team members
      return true;
    })
    const presenters = filteredMembers.map(member => {
      return plainToInstance(
        TeamMemberPresenter,
        {
          ...member,
          id: member.id,
          teamId: member.teamId,
          profileId: member.profile.id,
          role: member.role ?? null,
          title: member.title ?? null,
          isHidden: member.isHidden,
          permissions: Number(member.permissions ?? 0),
          status: member.status ?? 'current',
        }, {excludeExtraneousValues: true}
      )
    })
    return presenters
  }
}
