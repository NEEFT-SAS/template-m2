import { PlayerAvailabilityPresenter, PlayerBadgePresenter, PlayerPrivateProfilePresenter, PlayerProfilePresenter, PlayerSocialLinkPresenter } from "@neeft-sas/shared";

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
};

export type PlayerCredentialsUpdateInput = {
  email?: string;
};

export type PlayerProfileUpdatePayload = {
  profile: PlayerProfileUpdateInput;
  credentials?: PlayerCredentialsUpdateInput;
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

  findPlayerBadgeContextBySlug(userSlug: string): Promise<any | null>;
  findAssignedBadgeIds(userProfileId: string): Promise<number[]>;
}
