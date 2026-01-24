
import { Inject, Injectable } from '@nestjs/common';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { SocialLinkDuplicatePlatformError, SocialLinkInvalidPlatformError } from '../../../domain/errors/player-social-links.errors';
import { PlayerSocialLinkPresenter, PlayerSocialLinkToUpdateDTO } from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { SocialLinksNormalizer } from '@/contexts/players/infra/normalizers/social-links.normalizer';
import { plainToInstance } from 'class-transformer';
import { PlayerNotFoundError } from '@/contexts/players/domain/errors/player-profile.errors';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { PlayerSearchSyncEvent } from '@/contexts/players/domain/events/player-search-sync.event';

@Injectable()
export class UpdatePlayerSocialLinksUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    private readonly normalizer: SocialLinksNormalizer,
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort,
  ) {}

  async execute(userSlug: string, links: PlayerSocialLinkToUpdateDTO[]) {
    const ids = links.map((l) => l.rscSocialPlatformId);
    const uniq = new Set(ids);
    if (uniq.size !== ids.length) throw new SocialLinkDuplicatePlatformError(userSlug);
    
    const snapshot = this.resourcesStore.getSnapshot();

    const allowedIds = new Set(snapshot.rscSocialPlatforms.map((p) => p.id));
    const invalidIds = [...new Set(ids.filter((id) => !allowedIds.has(id)))];
    if (invalidIds.length) {
      throw new SocialLinkInvalidPlatformError(userSlug, invalidIds);
    }

    const normalizedLinks = this.normalizer.normalize(
      links,
      snapshot.rscSocialPlatforms,
    );  

    const playerProfileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!playerProfileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const newLinks = await this.repo.replaceSocialLinks(playerProfileId, normalizedLinks);

    await this.eventBus.publish(PlayerSearchSyncEvent.create({ slug: userSlug }));
    
    return plainToInstance(PlayerSocialLinkPresenter, newLinks, { excludeExtraneousValues: true });
  }
}
