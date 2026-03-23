import { Inject, Injectable } from '@nestjs/common';
import { FollowStatusPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { FollowActionInput } from '../types/follow.types';
import { FOLLOW_REPOSITORY, FollowRepositoryPort } from '../ports/follow.repository.port';
import {  FollowMissingTeamPermission, FollowNotFoundError, FollowSelfNotAllowedError, FollowTargetNotFoundError } from '../../domain/errors/follow.errors';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';
import { hasPermissions } from '@/core/security/permissions';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';

@Injectable()
export class UnfollowEntityUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY) private readonly followRepo: FollowRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
  ) {}

  async execute(
    requesterId: string | null | undefined,
    requesterSlug: string | undefined,
    input: FollowActionInput,
  ): Promise<FollowStatusPresenter> {
    const followerIsTeam = input.followerType === 'TEAM';
    const followingTeam = input.followedType === 'TEAM';
    const targetSlug = input.followedSlug;
    const followerSlug = !followerIsTeam ? requesterSlug : input.followerSlug;

    if(!followerIsTeam && !followingTeam && targetSlug === followerSlug) throw new FollowSelfNotAllowedError();

    const target = await this.followRepo.resolveEntityByTypeAndSlug(input.followedType, targetSlug);
    const follower = await this.followRepo.resolveEntityByTypeAndSlug(input.followerType, followerSlug);
    
    if (!target) {
      throw new FollowTargetNotFoundError('PLAYER', input.followedSlug);
    }
    if (!follower) {
      throw new FollowTargetNotFoundError('TEAM', followerSlug);
    }
    if (followerIsTeam) {
      const isMember = await this.teamRepo.findTeamMemberByProfile(follower.id, requesterId);
      if (!isMember) throw new FollowMissingTeamPermission();
      if(!hasPermissions(isMember.permissions, TEAM_MEMBER_PERMISSIONS.MANAGE_FOLLOW)) throw new FollowMissingTeamPermission();
    }

    const exist = await this.followRepo.existsFollow(input.followerType, follower.id, input.followedType, target.id);
    if (!exist) throw new FollowNotFoundError();

    const follow = await this.followRepo.deleteFollow(input.followerType, follower.id, input.followedType, target.id);

    return plainToInstance(FollowStatusPresenter, {
      isFollowing: false,
      targetType: input.followedType,
      targetSlug: target.slug,
    }, { excludeExtraneousValues: true });
    

  }
}
