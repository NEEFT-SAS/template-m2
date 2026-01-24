import type { TeamOrganizationType } from '@neeft-sas/shared';
import type { TeamEntity } from '../../infra/entities/team.entity';

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');

export type CreateTeamInput = {
  ownerProfileId: string;
  slug: string;
  name: string;
  acronym: string;
  organizationType: TeamOrganizationType;
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
  organizationType?: TeamOrganizationType;
  description?: string | null;
  quote?: string | null;
  bannerPicture?: string | null;
  logoPicture?: string | null;
  foundedAt?: Date | null;
  city?: string | null;
  countryId?: string | null;
  languageIds?: string[] | null;
};

export interface TeamRepositoryPort {
  existsSlug(slug: string): Promise<boolean>;
  existsOwnerProfile(ownerProfileId: string): Promise<boolean>;
  findTeamById(teamId: string): Promise<TeamEntity | null>;
  createTeam(input: CreateTeamInput): Promise<TeamEntity>;
  updateTeam(teamId: string, input: UpdateTeamInput): Promise<TeamEntity | null>;
  deleteTeam(teamId: string): Promise<void>;
}
