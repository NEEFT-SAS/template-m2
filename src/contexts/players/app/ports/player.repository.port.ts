import { PlayerAvailabilityPresenter, PlayerBadgePresenter, PlayerEducationExperiencePresenter, PlayerExperiencePresenter, PlayerPrivateProfilePresenter, PlayerProfessionalExperiencePresenter, PlayerProfilePresenter, PlayerReportPresenter, PlayerReportReason, PlayerReportStatus, PlayerSocialLinkPresenter } from "@neeft-sas/shared";

export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');

export type PlayerProfileContext = {
  userProfileId: string;
  userCredentialId: string;
};

export type PlayerProfileUpdateInput = {
  firstname?: string;
  lastname?: string;
  birthDate?: Date;
  description?: string | null;
  citation?: string | null;
  profilePicture?: string | null;
  bannerPicture?: string | null;
  nationalityId?: string | null;
  languageIds?: string[] | null;
};

export type PlayerCredentialsUpdateInput = {
  email?: string;
};

export type PlayerProfileUpdatePayload = {
  profile: PlayerProfileUpdateInput;
  credentials?: PlayerCredentialsUpdateInput;
};

export type PlayerExperienceInput = {
  teamName?: string | null;
  jobTitle: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
};

export type PlayerExperienceUpdateInput = {
  teamName?: string | null;
  jobTitle?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date | null;
};

export type PlayerEducationExperienceInput = {
  title: string;
  school: string;
  location?: string | null;
  fieldOfStudy?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  ongoing?: boolean;
  description?: string | null;
};

export type PlayerEducationExperienceUpdateInput = {
  title?: string;
  school?: string;
  location?: string | null;
  fieldOfStudy?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  ongoing?: boolean;
  description?: string | null;
};

export type PlayerProfessionalExperienceInput = {
  title: string;
  company: string;
  location?: string | null;
  contractType?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  ongoing?: boolean;
  description?: string | null;
};

export type PlayerProfessionalExperienceUpdateInput = {
  title?: string;
  company?: string;
  location?: string | null;
  contractType?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  ongoing?: boolean;
  description?: string | null;
};

export type PlayerReportCreateInput = {
  reporterProfileId: string;
  targetProfileId: string;
  reason: PlayerReportReason;
  details: string;
};

export interface PlayerRepositoryPort {
  findPublicProfileBySlug(slug: string): Promise<PlayerProfilePresenter | null>; // public info only
  findPrivateProfileBySlug(slug: string): Promise<PlayerPrivateProfilePresenter | null>; // public info + email + birthDate
  findProfileIdBySlug(slug: string): Promise<string | null>; // profileId only
  findProfileContextBySlug(slug: string): Promise<PlayerProfileContext | null>; // profileId + credentialId
  updateProfile(context: PlayerProfileContext, payload: PlayerProfileUpdatePayload): Promise<void>; // update profile and optionally credentials

  findSocialLinks(userProfileId: string): Promise<PlayerSocialLinkPresenter[]>;
  replaceSocialLinks(userProfileId: string, links: PlayerSocialLinkPresenter[]): Promise<PlayerSocialLinkPresenter[]>;
  replaceAvailabilities(userProfileId: string, availabilities: PlayerAvailabilityPresenter[]): Promise<PlayerAvailabilityPresenter[]>;
  
  addExperience(userProfileId: string, input: PlayerExperienceInput): Promise<PlayerExperiencePresenter>;
  findExperiences(userProfileId: string): Promise<PlayerExperiencePresenter[]>;
  findExperienceById(userProfileId: string, experienceId: number): Promise<PlayerExperiencePresenter | null>;
  updateExperience(userProfileId: string, experienceId: number, input: PlayerExperienceUpdateInput): Promise<PlayerExperiencePresenter>;
  deleteExperience(userProfileId: string, experienceId: number): Promise<void>;
  addEducationExperience(userProfileId: string, input: PlayerEducationExperienceInput): Promise<PlayerEducationExperiencePresenter>;
  findEducationExperiences(userProfileId: string): Promise<PlayerEducationExperiencePresenter[]>;
  findEducationExperienceById(userProfileId: string, experienceId: number): Promise<PlayerEducationExperiencePresenter | null>;
  updateEducationExperience(userProfileId: string, experienceId: number, input: PlayerEducationExperienceUpdateInput): Promise<PlayerEducationExperiencePresenter>;
  deleteEducationExperience(userProfileId: string, experienceId: number): Promise<void>;
  addProfessionalExperience(userProfileId: string, input: PlayerProfessionalExperienceInput): Promise<PlayerProfessionalExperiencePresenter>;
  findProfessionalExperiences(userProfileId: string): Promise<PlayerProfessionalExperiencePresenter[]>;
  findProfessionalExperienceById(userProfileId: string, experienceId: number): Promise<PlayerProfessionalExperiencePresenter | null>;
  updateProfessionalExperience(userProfileId: string, experienceId: number, input: PlayerProfessionalExperienceUpdateInput): Promise<PlayerProfessionalExperiencePresenter>;
  deleteProfessionalExperience(userProfileId: string, experienceId: number): Promise<void>;

  findPlayerBadgeContextBySlug(userSlug: string): Promise<any | null>;
  findAssignedBadgeIds(userProfileId: string): Promise<number[]>;

  findPlayerReports(userProfileId: string): Promise<PlayerReportPresenter[]>;
  findPlayerReportById(userProfileId: string, reportId: string): Promise<PlayerReportPresenter | null>;
  createPlayerReport(input: PlayerReportCreateInput): Promise<PlayerReportPresenter>;
  updatePlayerReportStatus(userProfileId: string, reportId: string, status: PlayerReportStatus): Promise<PlayerReportPresenter | null>;
}
