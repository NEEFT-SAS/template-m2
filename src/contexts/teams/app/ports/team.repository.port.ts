import type { TeamMemberRole, TeamRosterMemberRole } from '@neeft-sas/shared';
import type { TeamEntity } from '../../infra/entities/team.entity';
import type { TeamMemberEntity } from '../../infra/entities/team-member.entity';
import type { TeamRosterEntity } from '../../infra/entities/team-roster.entity';
import type { TeamRosterMemberEntity } from '../../infra/entities/team-roster-member.entity';
import type { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');

export type CreateTeamInput = {
  ownerProfileId: string;
  slug: string;
  name: string;
  acronym: string;
  description?: string | null;
  quote?: string | null;
  bannerPicture?: string | null;
  logoPicture?: string | null;
  foundedAt?: Date | null;
  city?: string | null;
  countryId?: string | null;
  languageIds: string[];
};

export type UpdateTeamInput = {
  acronym?: string;
  description?: string | null;
  quote?: string | null;
  bannerPicture?: string | null;
  logoPicture?: string | null;
  foundedAt?: Date | null;
  city?: string | null;
  countryId?: string | null;
  languageIds?: string[] | null;
};

export type CreateTeamMemberInput = {
  profileId: string;
  role?: TeamMemberRole | null;
  title?: string | null;
  isHidden?: boolean;
  permissions?: bigint;
};

export type UpdateTeamMemberInput = {
  role?: TeamMemberRole | null;
  title?: string | null;
  isHidden?: boolean;
  permissions?: bigint;
};

export type CreateTeamRosterInput = {
  name: string;
  slug: string;
  description?: string | null;
  gameId: number;
  isActive: boolean;
};

export type CreateTeamRosterMemberInput = {
  memberId: string;
  role?: TeamRosterMemberRole | null;
  title?: string | null;
  positionId?: number | null;
  isHidden?: boolean;
  permissions?: number;
};

export interface TeamRepositoryPort {
  existsSlug(slug: string): Promise<boolean>;
  existsOwnerProfile(ownerProfileId: string): Promise<boolean>;
  findTeamById(teamId: string): Promise<TeamEntity | null>;
  findTeamBySlug(slug: string): Promise<TeamEntity | null>;
  findProfileBySlug(slug: string): Promise<UserProfileEntity | null>;
  findTeamMemberByProfile(teamId: string, profileId: string): Promise<TeamMemberEntity | null>;
  findTeamMemberById(teamId: string, memberId: string): Promise<TeamMemberEntity | null>;
  findRosterById(teamId: string, rosterId: string): Promise<TeamRosterEntity | null>;
  findRosterMemberByRosterAndMember(rosterId: string, memberId: string): Promise<TeamRosterMemberEntity | null>;
  existsRosterSlug(teamId: string, slug: string): Promise<boolean>;
  createTeam(input: CreateTeamInput): Promise<TeamEntity>;
  createTeamMember(teamId: string, input: CreateTeamMemberInput): Promise<TeamMemberEntity>;
  createRoster(teamId: string, input: CreateTeamRosterInput): Promise<TeamRosterEntity>;
  createRosterMember(rosterId: string, input: CreateTeamRosterMemberInput): Promise<TeamRosterMemberEntity>;
  updateTeam(teamId: string, input: UpdateTeamInput): Promise<TeamEntity | null>;
  updateTeamMember(teamId: string, memberId: string, input: UpdateTeamMemberInput): Promise<TeamMemberEntity | null>;
  deleteTeam(teamId: string): Promise<void>;
  deleteTeamMember(teamId: string, memberId: string): Promise<void>;
  findTeamsByProfile(profileId: string): Promise<TeamEntity[]>;
  findTeamMemberWithProfile(teamId: string, memberId: string): Promise<TeamMemberEntity | null>;
  findTeamMembersWithProfile(teamId: string): Promise<TeamMemberEntity[] | null>;
  findTeamOwnerMember(teamId: string): Promise<TeamMemberEntity | null>;
  ensureTeamMemberIsValid(teamId: string, member: TeamMemberEntity): boolean;
  saveTeamMemberEntity(member: TeamMemberEntity): Promise<TeamMemberEntity>;
}
