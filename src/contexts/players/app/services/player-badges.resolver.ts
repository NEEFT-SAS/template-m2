import { Injectable } from '@nestjs/common';
import { diffDates, PlayerBadgePresenter, RscBadgeScope, RscProfileBadgePresenter } from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';

type ResolvePlayerBadgesParams = {
  assignedRscBadgeIds: number[];
  profileCreatedAt: Date;
  isEmailVerified: boolean;
};

@Injectable()
export class PlayerBadgesResolver {
  constructor(private readonly resourcesStore: ResourcesStore) {}

  resolve(params: ResolvePlayerBadgesParams): PlayerBadgePresenter[] {
    const snapshot = this.resourcesStore.getSnapshot();

    const byId = new Map<number, RscProfileBadgePresenter>();
    const byKey = new Map<string, RscProfileBadgePresenter>();
    for (const b of snapshot.rscProfileBadges) {
      byId.set(b.id, b);
      byKey.set(b.key, b);
    }

    const finalIds = new Set<number>(params.assignedRscBadgeIds);

    // BADGE calcule: VERIFIED
    if (params.isEmailVerified) {
      const verified = byKey.get('verified');
      if (verified) finalIds.add(verified.id);
    }

    // BADGE calcule: NEW (7 jours)    
    const registeredAt = diffDates(new Date(), params.profileCreatedAt);
    const isNew = registeredAt.days <= 7;
    
    if (isNew) {
      const newbie = byKey.get('new_user');
      if (newbie) finalIds.add(newbie.id);
    }
    
    const out: PlayerBadgePresenter[] = [];

    for (const id of finalIds) {
      const badge = byId.get(id);
      if (!badge) continue;

      // badge visible pour player si scope = player ou both
      if (badge.scope !== RscBadgeScope.PLAYER && badge.scope !== RscBadgeScope.BOTH) continue;

      out.push({
        rscBadgeId: badge.id,
        key: badge.key,
        label: badge.label,
        icon: badge.icon ?? null,
        priority: badge.priority,
        scope: badge.scope,
      });
    }

    out.sort((a, b) => a.priority - b.priority);
    return out;
  }

}
