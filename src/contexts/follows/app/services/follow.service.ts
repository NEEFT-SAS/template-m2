import { Inject, Injectable } from '@nestjs/common';
import { toLowerCaseTrim } from '@neeft-sas/shared';
import { FollowEntityType } from '../../domain/types/follow.types';
import {
  FOLLOW_REPOSITORY,
  FollowRepositoryPort,
} from '../ports/follow.repository.port';
import {
  FOLLOW_SUBJECTS_REPOSITORY,
  FollowSubjectsRepositoryPort,
} from '../ports/follow-subjects.repository.port';
import {
  FollowAlreadyExistsError,
  FollowForbiddenError,
  FollowFollowerNotFoundError,
  FollowInvalidFollowerError,
  FollowInvalidTargetError,
  FollowNotFoundError,
  FollowSelfNotAllowedError,
  FollowTargetNotFoundError,
} from '../../domain/errors/follow.errors';

export type FollowActionInput = {
  followerType?: FollowEntityType;
  followerSlug?: string;
  followedType?: FollowEntityType;
  followedSlug?: string;
};

export type FollowListItem = {
  id: string;
  slug: string;
  profilePicture?: string | null;
  logoPicture?: string | null;
  type: FollowEntityType;
};

export type FollowListResult = {
  items: FollowListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type FollowStatusResult = {
  isFollowingAsPlayer: boolean;
  isFriend: boolean;
  followingAsTeams: Array<{ teamSlug: string }>;
  followersCount: number;
};

type FollowPagination = {
  limit?: number;
  offset?: number;
};

@Injectable()
export class FollowService {
  constructor(
    @Inject(FOLLOW_REPOSITORY)
    private readonly followRepo: FollowRepositoryPort,
    @Inject(FOLLOW_SUBJECTS_REPOSITORY)
    private readonly followSubjectsRepo: FollowSubjectsRepositoryPort,
  ) {}

  async follow(
    input: FollowActionInput,
    requesterProfileId: string,
    requesterSlug?: string | null,
  ): Promise<FollowStatusResult> {
    const follower = await this.resolveFollower(input, requesterProfileId, requesterSlug ?? undefined);
    const target = await this.resolveTarget(input);

    if (follower.type === target.type && follower.id === target.id) {
      throw new FollowSelfNotAllowedError();
    }

    const existing = await this.followRepo.existsFollow(
      follower.type,
      follower.id,
      target.type,
      target.id,
    );
    if (existing) {
      throw new FollowAlreadyExistsError();
    }

    await this.followRepo.createFollow(follower.type, follower.id, target.type, target.id);

    return this.getFollowStatus(target.type, target.slug, requesterProfileId);
  }

  async unfollow(
    input: FollowActionInput,
    requesterProfileId: string,
    requesterSlug?: string | null,
  ): Promise<FollowStatusResult> {
    const follower = await this.resolveFollower(input, requesterProfileId, requesterSlug ?? undefined);
    const target = await this.resolveTarget(input);

    if (follower.type === target.type && follower.id === target.id) {
      throw new FollowSelfNotAllowedError();
    }

    const removed = await this.followRepo.deleteFollow(
      follower.type,
      follower.id,
      target.type,
      target.id,
    );
    if (!removed) {
      throw new FollowNotFoundError();
    }

    return this.getFollowStatus(target.type, target.slug, requesterProfileId);
  }

  async getFollowing(
    followerType: FollowEntityType,
    slug: string | undefined,
    requesterProfileId: string | null | undefined,
    pagination: FollowPagination,
  ): Promise<FollowListResult> {
    const { limit = 20, offset = 0 } = pagination ?? {};

    if (!slug && followerType !== 'PLAYER') {
      throw new FollowInvalidFollowerError(followerType, null);
    }

    const followerId = slug
      ? await this.resolveEntityIdBySlug(followerType, slug)
      : requesterProfileId ?? null;

    if (!followerId) {
      throw new FollowFollowerNotFoundError(followerType, slug ?? '');
    }

    const result = await this.followRepo.listFollowing(followerType, followerId, limit, offset);
    const items = result.items;
    const total = result.total;

    return { items, total, limit, offset };
  }

  async getFollowers(
    targetType: FollowEntityType,
    slug: string | undefined,
    requesterProfileId: string | null | undefined,
    pagination: FollowPagination,
  ): Promise<FollowListResult> {
    const { limit = 20, offset = 0 } = pagination ?? {};

    if (!slug && targetType !== 'PLAYER') {
      throw new FollowInvalidTargetError(targetType, null);
    }

    const targetId = slug
      ? await this.resolveEntityIdBySlug(targetType, slug)
      : requesterProfileId ?? null;

    if (!targetId) {
      throw new FollowTargetNotFoundError(targetType, slug ?? '');
    }

    const result = await this.followRepo.listFollowers(targetType, targetId, limit, offset);
    const items = result.items;
    const total = result.total;

    return { items, total, limit, offset };
  }

  async getFollowStatus(
    targetType: FollowEntityType,
    targetSlug: string,
    requesterProfileId: string | null | undefined,
  ): Promise<FollowStatusResult> {
    const targetId = await this.resolveEntityIdBySlug(targetType, targetSlug);
    if (!targetId) {
      return {
        isFollowingAsPlayer: false,
        isFriend: false,
        followingAsTeams: [],
        followersCount: 0,
      };
    }

    const requesterId = requesterProfileId ?? '';
    const isFollowingAsPlayer = requesterId
      ? await this.isFollowing('PLAYER', requesterId, targetType, targetId)
      : false;

    let isFriend = false;
    if (targetType === 'PLAYER' && isFollowingAsPlayer && requesterId) {
      isFriend = await this.isFollowing('PLAYER', targetId, 'PLAYER', requesterId);
    }

    let followingAsTeams: Array<{ teamSlug: string }> = [];
    if (requesterId) {
      const teams = await this.listTeamsWithFollowPermission(requesterId);
      if (teams.length) {
        const teamIds = teams.map((team) => team.id);
        const teamFollowerIds = await this.followRepo.listTeamFollowerIdsFollowingTarget(
          teamIds,
          targetType,
          targetId,
        );

        const teamSlugById = new Map(teams.map((team) => [team.id, team.slug]));
        followingAsTeams = teamFollowerIds
          .map((teamId) => {
            const slug = teamSlugById.get(teamId);
            return slug ? { teamSlug: slug } : null;
          })
          .filter((item): item is { teamSlug: string } => item !== null);
      }
    }

    const followersCount = await this.followRepo.countFollowers(targetType, targetId);

    return {
      isFollowingAsPlayer,
      isFriend,
      followingAsTeams,
      followersCount,
    };
  }

  private async resolveFollower(
    input: FollowActionInput,
    requesterProfileId: string,
    requesterSlug?: string,
  ): Promise<{ id: string; slug: string; type: FollowEntityType }> {
    const type: FollowEntityType = input.followerType ?? 'PLAYER';
    let slug = input.followerSlug;

    if (type === 'TEAM') {
      if (!slug) {
        throw new FollowInvalidFollowerError(type, slug ?? null);
      }

      const team = await this.assertTeamFollowPermission(slug, requesterProfileId);
      return { id: team.id, slug: team.slug, type };
    }

    if (!slug) {
      slug = requesterSlug ?? (await this.resolveProfileSlugById(requesterProfileId)) ?? undefined;
    }

    if (!slug) {
      throw new FollowInvalidFollowerError(type, slug ?? null);
    }

    const followerId = await this.resolveEntityIdBySlug(type, slug);
    if (!followerId) {
      throw new FollowFollowerNotFoundError(type, slug);
    }

    return { id: followerId, slug, type };
  }

  private async resolveTarget(
    input: FollowActionInput,
  ): Promise<{ id: string; slug: string; type: FollowEntityType }> {
    const type = input.followedType;
    const slug = input.followedSlug;

    if (!type || !slug) {
      throw new FollowInvalidTargetError(type, slug ?? null);
    }

    const id = await this.resolveEntityIdBySlug(type, slug);
    if (!id) {
      throw new FollowTargetNotFoundError(type, slug);
    }

    return { id, slug, type };
  }

  private async resolveProfileSlugById(profileId: string): Promise<string | null> {
    return this.followSubjectsRepo.findPlayerSlugById(profileId);
  }

  private async resolveEntityIdBySlug(type: FollowEntityType, slug: string): Promise<string | null> {
    const normalized = toLowerCaseTrim(slug);
    if (!normalized) return null;

    if (type === 'PLAYER') {
      const player = await this.followSubjectsRepo.findPlayerBySlug(normalized);
      return player?.id ?? null;
    }

    const team = await this.followSubjectsRepo.findTeamBySlug(normalized);
    return team?.id ?? null;
  }

  private async assertTeamFollowPermission(
    teamSlug: string,
    requesterProfileId: string,
  ): Promise<{ id: string; slug: string }> {
    const normalized = toLowerCaseTrim(teamSlug);
    if (!normalized) {
      throw new FollowInvalidFollowerError('TEAM', teamSlug ?? null);
    }

    const team = await this.followSubjectsRepo.findTeamBySlug(normalized);

    if (!team) {
      throw new FollowFollowerNotFoundError('TEAM', teamSlug);
    }

    const canManageFollow = await this.followSubjectsRepo.canManageTeamFollow(team.id, requesterProfileId);
    if (!canManageFollow) {
      throw new FollowForbiddenError(team.slug);
    }

    return { id: team.id, slug: team.slug };
  }

  private async listTeamsWithFollowPermission(profileId: string): Promise<Array<{ id: string; slug: string }>> {
    return this.followSubjectsRepo.listTeamsWithFollowPermission(profileId);
  }

  private async isFollowing(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<boolean> {
    return this.followRepo.existsFollow(followerType, followerId, followedType, followedId);
  }
}
