import type { FollowEntityType } from '../../domain/types/follow.types';

export const FOLLOW_REPOSITORY = Symbol('FOLLOW_REPOSITORY');

export type FollowGraphNode = {
  id: string;
  slug: string;
  profilePicture?: string | null;
  logoPicture?: string | null;
  type: FollowEntityType;
};

export type FollowPageResult = {
  items: FollowGraphNode[];
  total: number;
};

export interface FollowRepositoryPort {
  createFollow(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<void>;

  deleteFollow(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<boolean>;

  existsFollow(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<boolean>;

  listFollowing(
    followerType: FollowEntityType,
    followerId: string,
    limit: number,
    offset: number,
  ): Promise<FollowPageResult>;

  listFollowers(
    targetType: FollowEntityType,
    targetId: string,
    limit: number,
    offset: number,
  ): Promise<FollowPageResult>;

  listTeamFollowerIdsFollowingTarget(
    teamIds: string[],
    targetType: FollowEntityType,
    targetId: string,
  ): Promise<string[]>;

  countFollowers(targetType: FollowEntityType, targetId: string): Promise<number>;
}
