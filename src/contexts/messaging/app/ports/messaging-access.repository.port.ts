import { MessagingEntityType } from '../../domain/types/messaging.types';

export const MESSAGING_ACCESS_REPOSITORY = Symbol('MESSAGING_ACCESS_REPOSITORY');

export type MessagingPlayerSnapshot = {
  id: string;
  slug: string;
  username: string;
  profilePicture: string | null;
};

export type MessagingTeamSnapshot = {
  id: string;
  slug: string;
  name: string;
  logoPicture: string | null;
};

export interface MessagingAccessRepositoryPort {
  findPlayerById(profileId: string): Promise<MessagingPlayerSnapshot | null>;
  findPlayerBySlug(slug: string): Promise<MessagingPlayerSnapshot | null>;
  findPlayersByIds(profileIds: string[]): Promise<MessagingPlayerSnapshot[]>;
  findTeamById(teamId: string): Promise<MessagingTeamSnapshot | null>;
  findTeamBySlug(slug: string): Promise<MessagingTeamSnapshot | null>;
  findTeamsByIds(teamIds: string[]): Promise<MessagingTeamSnapshot[]>;
  canAccessTeam(teamId: string, profileId: string): Promise<boolean>;
  listAccessibleTeams(profileId: string): Promise<MessagingTeamSnapshot[]>;
  listTeamMemberProfileIds(teamId: string): Promise<string[]>;
  listEntityProfileIds(entityType: MessagingEntityType, entityId: string): Promise<string[]>;
}
