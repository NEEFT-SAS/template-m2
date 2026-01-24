import type { PlayerAvailabilityPresenter, PlayerBadgePresenter, PlayerEducationExperiencePresenter, PlayerExperiencePresenter, PlayerGamePresenter, PlayerPrivateProfilePresenter, PlayerProfessionalExperiencePresenter, PlayerProfilePresenter, PlayerReportPresenter, PlayerReportReason, PlayerReportStatus, PlayerSocialLinkPresenter, UserProfileAttendanceMode, UserProfileEducationStatus } from "@neeft-sas/shared";

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
  schoolName: string;
  schoolLogoUrl?: string | null;
  diplomaName: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  location?: string | null;
  educationStatus?: UserProfileEducationStatus | null;
  attendanceMode?: UserProfileAttendanceMode | null;
  mention?: string | null;
};

export type PlayerEducationExperienceUpdateInput = {
  schoolName?: string;
  schoolLogoUrl?: string | null;
  diplomaName?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  location?: string | null;
  educationStatus?: UserProfileEducationStatus | null;
  attendanceMode?: UserProfileAttendanceMode | null;
  mention?: string | null;
};

export type PlayerProfessionalExperienceInput = {
  companyName: string;
  companyLogoUrl?: string | null;
  positionTitle: string;
  contractType?: string | null;
  description?: string | null;
  missions?: string[] | null;
  startDate: Date;
  endDate?: Date | null;
  location?: string | null;
};

export type PlayerProfessionalExperienceUpdateInput = {
  companyName?: string;
  companyLogoUrl?: string | null;
  positionTitle?: string;
  contractType?: string | null;
  description?: string | null;
  missions?: string[] | null;
  startDate?: Date;
  endDate?: Date | null;
  location?: string | null;
};

export type PlayerGameModeRankInput = {
  modeId: number;
  rankId: number;
};

export type PlayerGameAccountInput =
  | {
      type: 'league-of-legends';
      username: string;
      tagLine: string;
      region?: string | null;
      puuid?: string | null;
    }
  | {
      type: 'rocket-league';
      username: string;
    }
  | {
      type: 'valorant';
      username: string;
      tagLine: string;
    }
  | {
      type: 'brawl-stars';
      username: string;
    }
  | {
      type: 'fortnite';
      username: string;
    };

export type PlayerGameCreateInput = {
  gameId: number;
  isRecruitable: boolean;
  isFavoriteGame: boolean;
  trackerUrl?: string | null;
  positionIds?: number[] | null;
  platformIds?: number[] | null;
  characterIds?: number[] | null;
  modeRanks?: PlayerGameModeRankInput[] | null;
  account?: PlayerGameAccountInput | null;
};

export type PlayerGameUpdateInput = {
  isRecruitable?: boolean;
  isFavoriteGame?: boolean;
  trackerUrl?: string | null;
  positionIds?: number[] | null;
  platformIds?: number[] | null;
  characterIds?: number[] | null;
  modeRanks?: PlayerGameModeRankInput[] | null;
  account?: PlayerGameAccountInput | null;
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
  findEducationExperienceById(userProfileId: string, experienceId: string): Promise<PlayerEducationExperiencePresenter | null>;
  updateEducationExperience(userProfileId: string, experienceId: string, input: PlayerEducationExperienceUpdateInput): Promise<PlayerEducationExperiencePresenter>;
  deleteEducationExperience(userProfileId: string, experienceId: string): Promise<void>;
  addProfessionalExperience(userProfileId: string, input: PlayerProfessionalExperienceInput): Promise<PlayerProfessionalExperiencePresenter>;
  findProfessionalExperiences(userProfileId: string): Promise<PlayerProfessionalExperiencePresenter[]>;
  findProfessionalExperienceById(userProfileId: string, experienceId: string): Promise<PlayerProfessionalExperiencePresenter | null>;
  updateProfessionalExperience(userProfileId: string, experienceId: string, input: PlayerProfessionalExperienceUpdateInput): Promise<PlayerProfessionalExperiencePresenter>;
  deleteProfessionalExperience(userProfileId: string, experienceId: string): Promise<void>;
  findPlayerGameIdByProfileAndGame(userProfileId: string, gameId: number): Promise<number | null>;
  createPlayerGame(userProfileId: string, input: PlayerGameCreateInput): Promise<PlayerGamePresenter>;
  findPlayerGames(userProfileId: string): Promise<PlayerGamePresenter[]>;
  findPlayerGameByProfileAndGame(userProfileId: string, gameId: number): Promise<PlayerGamePresenter | null>;
  updatePlayerGame(userProfileId: string, gameId: number, input: PlayerGameUpdateInput): Promise<PlayerGamePresenter>;
  deletePlayerGame(userProfileId: string, gameId: number): Promise<void>;

  findPlayerBadgeContextBySlug(userSlug: string): Promise<any | null>;
  findAssignedBadgeIds(userProfileId: string): Promise<number[]>;

  findPlayerReports(userProfileId: string): Promise<PlayerReportPresenter[]>;
  findPlayerReportById(userProfileId: string, reportId: string): Promise<PlayerReportPresenter | null>;
  createPlayerReport(input: PlayerReportCreateInput): Promise<PlayerReportPresenter>;
  updatePlayerReportStatus(userProfileId: string, reportId: string, status: PlayerReportStatus): Promise<PlayerReportPresenter | null>;
}
