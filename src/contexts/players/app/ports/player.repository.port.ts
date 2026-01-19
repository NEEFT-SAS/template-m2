import { PlayerSocialLinkPresenter } from "@neeft-sas/shared";

export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');

export type PlayerPublicRecord = {
  id: string;
  username: string;
  slug: string;
  description: string | null;
  profilePicture: string | null;
  bannerPicture: string | null;
};

export interface PlayerRepositoryPort {
  findPublicProfileBySlug(slug: string): Promise<PlayerPublicRecord | null>;
  findProfileIdBySlug(slug: string): Promise<string | null>;

  findSocialLinks(userProfileId: string): Promise<PlayerSocialLinkPresenter[]>;
  replaceSocialLinks(userProfileId: string, links: PlayerSocialLinkPresenter[]): Promise<PlayerSocialLinkPresenter[]>;
}