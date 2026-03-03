import type { PlayerAvailabilityPresenter, PlayerReportReason, PlayerReportStatus, PlayerSocialLinkPresenter, RecommendationAuthorType, RecommendationRelationship, RecommendationTargetType, UserProfileAttendanceMode, UserProfileEducationStatus } from "@neeft-sas/shared";
import type { UserCredentialsEntity } from "@/contexts/auth/infra/persistence/entities/user-credentials.entity";
import type { UserProfileEntity } from "@/contexts/auth/infra/persistence/entities/user-profile.entity";
import { UserProfileGenderEnum } from "@/contexts/auth/domain/types/user-profile-gender.enum";
import type { UserProfileAvailabilityEntity } from "../../infra/entities/profile/user-profile-availability.entity";
import type { UserProfileExperienceEntity } from "../../infra/entities/profile/user-profile-experience.entity";
import type { UserProfileSchoolExperienceEntity } from "../../infra/entities/profile/user-profile-school-experience.entity";
import type { UserProfileProfessionalExperienceEntity } from "../../infra/entities/profile/user-profile-professional-experience.entity";
import type { UserReportEntity } from "../../infra/entities/profile/user-report.entity";
import type { UserSocialLinkEntity } from "../../infra/entities/profile/user-social-link.entity";
import type { UserGameEntity } from "../../infra/entities/game/user-game.entity";
import type { RecommendationEntity } from "../../infra/entities/recommendations/recommendation.entity";

export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');

export type PlayerProfileContext = {
  userProfileId: string;
  userCredentialId: string;
};

export type PlayerPrivateProfileSnapshot = {
  profile: UserProfileEntity;
  credentials: UserCredentialsEntity;
};

export type PlayerProfileUpdateInput = {
  firstname?: string;
  lastname?: string;
  birthDate?: Date;
  gender?: UserProfileGenderEnum;
  description?: string | null;
  citation?: string | null;
  profilePicture?: string | null;
  bannerPicture?: string | null;
  phone?: string | null;
  workSector?: string | null;
  contractType?: string | null;
  isDisabledPlayer?: boolean | null;
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
  elo?: number | null;
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

export type RecommendationCreateInput = {
  targetType: RecommendationTargetType;
  targetProfileId: string | null;
  targetTeamId: string | null;
  authorType: RecommendationAuthorType;
  authorProfileId: string | null;
  authorTeamId: string | null;
  authorDisplayName: string;
  authorSlug: string;
  authorAvatarUrl: string | null;
  gameSlug: string | null;
  gameName: string | null;
  gameIconUrl: string | null;
  role: string | null;
  relationship: RecommendationRelationship | null;
  tags: string[];
  content: string;
  rating: number | null;
};

export type RecommendationSnapshot = {
  id: string;
  targetType: RecommendationTargetType;
  targetProfileId: string | null;
  targetTeamId: string | null;
  authorType: RecommendationAuthorType;
  authorProfileId: string | null;
  authorTeamId: string | null;
};

export type RecommendationListQuery = {
  page: number;
  perPage: number;
};

export type RecommendationListResult = {
  items: RecommendationEntity[];
  total: number;
  ratingAverage: number | null;
  ratingCount: number;
  ratingSum: number;
};

export interface PlayerRepositoryPort {
  findPublicProfileBySlug(slug: string): Promise<UserProfileEntity | null>; // public info only
  findPrivateProfileBySlug(slug: string): Promise<PlayerPrivateProfileSnapshot | null>; // public info + email + birthDate
  findProfileIdBySlug(slug: string): Promise<string | null>; // profileId only
  findProfileContextBySlug(slug: string): Promise<PlayerProfileContext | null>; // profileId + credentialId
  updateProfile(context: PlayerProfileContext, payload: PlayerProfileUpdatePayload): Promise<void>; // update profile and optionally credentials

  findSocialLinks(userProfileId: string): Promise<UserSocialLinkEntity[]>;
  replaceSocialLinks(userProfileId: string, links: PlayerSocialLinkPresenter[]): Promise<UserSocialLinkEntity[]>;
  findAvailabilities(userProfileId: string): Promise<UserProfileAvailabilityEntity[]>;
  replaceAvailabilities(userProfileId: string, availabilities: PlayerAvailabilityPresenter[]): Promise<UserProfileAvailabilityEntity[]>;
  
  addExperience(userProfileId: string, input: PlayerExperienceInput): Promise<UserProfileExperienceEntity>;
  findExperiences(userProfileId: string): Promise<UserProfileExperienceEntity[]>;
  findExperienceById(userProfileId: string, experienceId: number): Promise<UserProfileExperienceEntity | null>;
  updateExperience(userProfileId: string, experienceId: number, input: PlayerExperienceUpdateInput): Promise<UserProfileExperienceEntity>;
  deleteExperience(userProfileId: string, experienceId: number): Promise<void>;
  addEducationExperience(userProfileId: string, input: PlayerEducationExperienceInput): Promise<UserProfileSchoolExperienceEntity>;
  findEducationExperiences(userProfileId: string): Promise<UserProfileSchoolExperienceEntity[]>;
  findEducationExperienceById(userProfileId: string, experienceId: string): Promise<UserProfileSchoolExperienceEntity | null>;
  updateEducationExperience(userProfileId: string, experienceId: string, input: PlayerEducationExperienceUpdateInput): Promise<UserProfileSchoolExperienceEntity>;
  deleteEducationExperience(userProfileId: string, experienceId: string): Promise<void>;
  addProfessionalExperience(userProfileId: string, input: PlayerProfessionalExperienceInput): Promise<UserProfileProfessionalExperienceEntity>;
  findProfessionalExperiences(userProfileId: string): Promise<UserProfileProfessionalExperienceEntity[]>;
  findProfessionalExperienceById(userProfileId: string, experienceId: string): Promise<UserProfileProfessionalExperienceEntity | null>;
  updateProfessionalExperience(userProfileId: string, experienceId: string, input: PlayerProfessionalExperienceUpdateInput): Promise<UserProfileProfessionalExperienceEntity>;
  deleteProfessionalExperience(userProfileId: string, experienceId: string): Promise<void>;
  findPlayerGameIdByProfileAndGame(userProfileId: string, gameId: number): Promise<number | null>;
  createPlayerGame(userProfileId: string, input: PlayerGameCreateInput): Promise<UserGameEntity>;
  findPlayerGames(userProfileId: string): Promise<UserGameEntity[]>;
  findPlayerGameByProfileAndGame(userProfileId: string, gameId: number): Promise<UserGameEntity | null>;
  updatePlayerGame(userProfileId: string, gameId: number, input: PlayerGameUpdateInput): Promise<UserGameEntity>;
  deletePlayerGame(userProfileId: string, gameId: number): Promise<void>;

  findPlayerBadgeContextBySlug(userSlug: string): Promise<any | null>;
  findAssignedBadgeIds(userProfileId: string): Promise<number[]>;

  findPlayerReports(userProfileId: string): Promise<UserReportEntity[]>;
  findPlayerReportById(userProfileId: string, reportId: string): Promise<UserReportEntity | null>;
  createPlayerReport(input: PlayerReportCreateInput): Promise<UserReportEntity>;
  updatePlayerReportStatus(userProfileId: string, reportId: string, status: PlayerReportStatus): Promise<UserReportEntity | null>;

  createRecommendation(input: RecommendationCreateInput): Promise<RecommendationEntity>;
  existsPlayerToPlayerRecommendation(authorProfileId: string, targetProfileId: string): Promise<boolean>;
  findRecommendationSnapshotById(recommendationId: string): Promise<RecommendationSnapshot | null>;
  deleteRecommendation(recommendationId: string): Promise<void>;
  findPlayerRecommendationsReceived(userProfileId: string, query: RecommendationListQuery): Promise<RecommendationListResult>;
  findPlayerRecommendationsGiven(userProfileId: string, query: RecommendationListQuery): Promise<RecommendationListResult>;
}
