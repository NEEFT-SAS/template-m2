import { FollowEntityType } from '../../domain/types/follow.types';

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
