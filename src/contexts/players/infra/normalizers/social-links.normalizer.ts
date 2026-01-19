import { Injectable } from "@nestjs/common";
import { PlayerSocialLinkToUpdateDTO, RscSocialPlatformPresenter, PlayerSocialLinkPresenter } from "@neeft-sas/shared";
import { normalizeSocialValue } from "./social-links.utils";

@Injectable()
export class SocialLinksNormalizer {
  normalize(links: PlayerSocialLinkToUpdateDTO[], rscPlatforms: RscSocialPlatformPresenter[]): PlayerSocialLinkPresenter[] {
    if (!links?.length) return [];

    const platformMap = new Map<number, RscSocialPlatformPresenter>();
    for (const p of rscPlatforms) platformMap.set(p.id, p);
    const result: PlayerSocialLinkPresenter[] = [];

    for (const link of links) {
      const platform = platformMap.get(link.rscSocialPlatformId);
      if (!platform) continue;

      const normalized = normalizeSocialValue(
        { type: platform.type, baseUrl: platform.baseUrl },
        link.value,
      );

      if (!normalized) continue;

      result.push({
        rscSocialPlatformId: link.rscSocialPlatformId,
        username: normalized.username,
        url: normalized.url,
      });
    }

    return result;
  }
}