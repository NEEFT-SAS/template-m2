import { Inject, Injectable } from '@nestjs/common';
import { FollowStatusPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { FollowEntityType } from '../../domain/types/follow.types';
import { FOLLOW_REPOSITORY, FollowRepositoryPort } from '../ports/follow.repository.port';
import { FOLLOW_SUBJECTS_REPOSITORY, FollowSubjectsRepositoryPort } from '../ports/follow-subjects.repository.port';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';

@Injectable()
export class GetFollowStatusUseCase {
  constructor(

    @Inject(FOLLOW_REPOSITORY) private readonly followRepo: FollowRepositoryPort,
    @Inject(FOLLOW_SUBJECTS_REPOSITORY) private readonly followSubjectsRepo: FollowSubjectsRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
  ) {}

  async execute(
    targetType: FollowEntityType,
    targetSlug: string,
    requesterProfileId: string | null | undefined,
  ): Promise<FollowStatusPresenter> {
    const target = await this.followRepo.resolveEntityByTypeAndSlug(targetType, targetSlug);
    if(!target.id) {
      throw new Error('Target entity not found');
    }

    const isFollowingAsPlayer = await this.followRepo.existsFollow('PLAYER', requesterProfileId, target.type, target.id);
    let isFriend = false;
    if (target.type === 'PLAYER' && isFollowingAsPlayer) {
      isFriend = await this.followRepo.existsFollow(target.type, target.id, 'PLAYER', requesterProfileId);
    }

    let followingAsTeams: Array<{teamSlug: string}> = []; 
    if(requesterProfileId) {
      const teams = await this.followSubjectsRepo.listTeamsWithFollowPermission(requesterProfileId);
      const teamIds = teams.map(team => team.id);
      if(teamIds.length) {
        const teamFollowerIds = await this.followRepo.listTeamFollowerIdsFollowingTarget(teamIds, target.type, target.id);
        const teamIdToSlugMap = teams.reduce((acc, team) => {
          acc[team.id] = team.slug;
          return acc;
        }, {} as Record<string, string>);
        followingAsTeams = teamFollowerIds.map(teamId => {
          const teamSlug = teamIdToSlugMap[teamId];
          return { teamSlug };
        }).filter(item => item.teamSlug)
      }
    }

    const p = plainToInstance(FollowStatusPresenter, { isFollowingAsPlayer, isFriend, followingAsTeams }, { excludeExtraneousValues: true });
    console.log(p)
    return p
  }
}
