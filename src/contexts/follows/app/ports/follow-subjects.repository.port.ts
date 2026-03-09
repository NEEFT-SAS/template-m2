import type { FollowEntityType } from '../../domain/types/follow.types';

export const FOLLOW_SUBJECTS_REPOSITORY = Symbol('FOLLOW_SUBJECTS_REPOSITORY');

export type FollowPlayerSnapshot = {
  id: string;
  slug: string;
  profilePicture?: string | null;
};

export type FollowTeamSnapshot = {
  id: string;
  slug: string;
  logoPicture?: string | null;
};

export type FollowSubjectSnapshot = {
  id: string;
  slug: string;
  type: FollowEntityType;
};

export interface FollowSubjectsRepositoryPort {
  findPlayerBySlug(slug: string): Promise<FollowPlayerSnapshot | null>;
  findTeamBySlug(slug: string): Promise<FollowTeamSnapshot | null>;
  findPlayerSlugById(profileId: string): Promise<string | null>;
  canManageTeamFollow(teamId: string, profileId: string): Promise<boolean>;
  listTeamsWithFollowPermission(profileId: string): Promise<Array<{ id: string; slug: string }>>;
}
