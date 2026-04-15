import { Inject, Injectable } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';

@Injectable()
export class SearchRecruitmentsUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
  ) { }

  async execute(query: any) {
    const { items, total } = await this.repo.search(query);
    return {
      items: items.map((item) => this.mapToPresenter(item)),
      total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    };
  }

  private mapToPresenter(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      description: item.description,
      missions: item.missions,
      urgent: item.urgent,
      isPaid: item.isPaid,
      target: item.target,
      team: item.team ? {
        id: item.team.id,
        name: item.team.name,
        slug: item.team.slug,
        logoPicture: item.team.logoPicture,
      } : null,
      game: item.game ? {
        id: item.game.id,
        name: item.game.name,
        slug: item.game.slug,
        icon: item.game.icon,
      } : null,
      platforms: (item.platforms || [])
        .slice()
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((p: any) => ({
          id: p.id,
          name: p.platform?.name || 'Platform',
          slug: p.platform?.slug || null,
          icon: p.platform?.icon || null,
          order: p.order ?? 0,
        })),
      positions: (item.positions || [])
        .slice()
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((p: any) => ({
          id: p.id,
          name: p.position?.name || 'Position',
          slug: p.position?.slug || null,
          icon: p.position?.icon || null,
          order: p.order ?? 0,
        })),
      ranks: (item.ranks || [])
        .slice()
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((r: any) => ({
          id: r.id,
          name: r.rank?.name || 'Rank',
          slug: r.rank?.slug || null,
          icon: r.rank?.icon || null,
          division: r.rank?.division || null,
          tier: r.rank?.tier || null,
          order: r.order ?? 0,
        })),
      minRankId: item.minRank?.id ?? null,
      maxRankId: item.maxRank?.id ?? null,
      minRank: item.minRank
        ? {
            id: item.minRank.id,
            name: item.minRank.rank?.name || 'Rank',
            slug: item.minRank.rank?.slug || null,
            icon: item.minRank.rank?.icon || null,
            division: item.minRank.rank?.division || null,
            tier: item.minRank.rank?.tier || null,
            order: item.minRank.order ?? 0,
          }
        : null,
      maxRank: item.maxRank
        ? {
            id: item.maxRank.id,
            name: item.maxRank.rank?.name || 'Rank',
            slug: item.maxRank.rank?.slug || null,
            icon: item.maxRank.rank?.icon || null,
            division: item.maxRank.rank?.division || null,
            tier: item.maxRank.rank?.tier || null,
            order: item.maxRank.order ?? 0,
          }
        : null,
      createdAt: item.createdAt,
    };
  }
}
