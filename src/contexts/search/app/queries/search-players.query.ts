import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessTokenPayload } from '@/contexts/auth/app/ports/token.port';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { BillingPlanKeyEnum } from '@/contexts/billing/infra/entitlements/billing-plans.registry';
import { SearchPremiumFiltersError } from '../../domain/errors/search.errors';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import { PlayerSearchDocument } from '../../infra/typesense/player-search.types';
import { RscProfileBadgePresenter } from '@neeft-sas/shared';
import { TypesenseService } from '../../infra/typesense/typesense.service';
import { PLAYER_SEARCH_COLLECTION } from '../../infra/typesense/player-search.schema';
import { SearchPlayersQueryDto } from '../../api/dtos/search-players.query.dto';

type SearchPlayersResult = {
  data: Array<{
    id: string;
    username: string;
    slug: string;
    profilePicture: string | null;
    bannerPicture: string | null;
    createdAt: string;
    badges: RscProfileBadgePresenter[];
  }>;
  meta: {
    found: number;
    page: number;
    perPage: number;
    outOf: number;
  };
};

@Injectable()
export class SearchPlayersQuery {
  constructor(
    private readonly typesense: TypesenseService,
    @InjectRepository(UserProfileEntity) private readonly profilesRepo: Repository<UserProfileEntity>,
    private readonly resourcesStore: ResourcesStore,
  ) {}

  async execute(query: SearchPlayersQueryDto, user?: AccessTokenPayload): Promise<SearchPlayersResult> {
    const premiumFiltersUsed = this.getPremiumFiltersUsed(query);
    if (premiumFiltersUsed.length) {
      const isPremium = await this.isPremiumUser(user);
      if (!isPremium) {
        throw new SearchPremiumFiltersError(premiumFiltersUsed);
      }
    }

    const q = query.q && query.q.trim() !== '' ? query.q.trim() : '*';
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const filterBy = this.buildFilters(query);
    const sortBy = q === '*' ? 'profileScore:desc' : '_text_match:desc,profileScore:desc';

    const response = await this.typesense.client
      .collections(PLAYER_SEARCH_COLLECTION)
      .documents()
      .search({
        q,
        query_by: 'username,slug',
        page,
        per_page: perPage,
        filter_by: filterBy || undefined,
        sort_by: sortBy,
      });

    const hits = response.hits ?? [];
    const badgeMap = this.buildBadgeMap();

    return {
      data: hits.map((hit) => this.mapDocument(hit.document as PlayerSearchDocument, badgeMap)),
      meta: {
        found: response.found ?? 0,
        page: response.page ?? page,
        perPage,
        outOf: response.out_of ?? 0,
      },
    };
  }

  private async isPremiumUser(user?: AccessTokenPayload): Promise<boolean> {
    const roles = (user as { roles?: string[] } | undefined)?.roles ?? [];
    if (Array.isArray(roles) && roles.includes('admin')) return true;

    const profileId = user?.pid;
    if (!profileId) return false;

    const profile = await this.profilesRepo.findOne({
      where: { id: profileId },
      select: ['billingPlanKey'],
    });

    if (!profile) return false;
    return profile.billingPlanKey !== BillingPlanKeyEnum.FREE;
  }

  private getPremiumFiltersUsed(query: SearchPlayersQueryDto): string[] {
    const filters: string[] = [];

    if (query.minProfileScore !== undefined) filters.push('minProfileScore');
    if (query.minExperienceCount !== undefined) filters.push('minExperienceCount');
    if (query.badgeIds && query.badgeIds.length) filters.push('badgeIds');
    if (query.hasSocialLinks !== undefined) filters.push('hasSocialLinks');

    return filters;
  }

  private buildFilters(query: SearchPlayersQueryDto): string {
    const filters: string[] = [];
    const quote = (value: string) => `\`${value}\``;

    if (query.nationalityId) {
      filters.push(`nationalityId:=${quote(query.nationalityId)}`);
    }

    if (query.languageIds && query.languageIds.length) {
      const values = query.languageIds.map(quote).join(',');
      filters.push(`languageIds:=[${values}]`);
    }

    if (query.badgeIds && query.badgeIds.length) {
      filters.push(`badgeIds:=[${query.badgeIds.join(',')}]`);
    }

    if (query.hasProfilePicture !== undefined) {
      filters.push(`hasProfilePicture:=${query.hasProfilePicture}`);
    }

    if (query.hasSocialLinks !== undefined) {
      filters.push(`socialLinksCount:${query.hasSocialLinks ? '>0' : '=0'}`);
    }

    if (query.minExperienceCount !== undefined) {
      filters.push(`experienceCount:>=${query.minExperienceCount}`);
    }

    if (query.minProfileScore !== undefined) {
      filters.push(`profileScore:>=${query.minProfileScore}`);
    }

    return filters.join(' && ');
  }

  private buildBadgeMap(): Map<number, RscProfileBadgePresenter> {
    const snapshot = this.resourcesStore.getSnapshot();
    const map = new Map<number, RscProfileBadgePresenter>();
    for (const badge of snapshot.rscProfileBadges) {
      map.set(badge.id, badge);
    }
    return map;
  }

  private mapDocument(
    doc: PlayerSearchDocument,
    badgeMap: Map<number, RscProfileBadgePresenter>,
  ): {
    id: string;
    username: string;
    slug: string;
    profilePicture: string | null;
    bannerPicture: string | null;
    createdAt: string;
    badges: RscProfileBadgePresenter[];
  } {
    const createdAt = new Date(Number(doc.createdAt));
    const badgeIds = doc.badgeIds ?? [];
    const badges = badgeIds
      .map((id) => badgeMap.get(id))
      .filter((badge): badge is RscProfileBadgePresenter => Boolean(badge))
      .sort((a, b) => a.priority - b.priority);

    return {
      id: doc.id,
      username: doc.username,
      slug: doc.slug,
      profilePicture: doc.profilePicture ?? null,
      bannerPicture: doc.bannerPicture ?? null,
      createdAt: Number.isNaN(createdAt.getTime()) ? new Date(0).toISOString() : createdAt.toISOString(),
      badges,
    };
  }
}
