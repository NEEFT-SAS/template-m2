import { Inject, Injectable } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import { RecruitmentNotFoundError } from '../../domain/errors/recruitment.errors';

@Injectable()
export class GetRecruitmentUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
  ) { }

  async execute(id: string) {
    const recruitment = await this.repo.findById(id);
    if (!recruitment) {
      throw new RecruitmentNotFoundError(id);
    }
    return this.mapToFullPresenter(recruitment);
  }

  private mapToFullPresenter(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      description: item.description,
      urgent: item.urgent,
      isPaid: item.isPaid,
      missions: item.missions,
      target: item.target,
      team: item.team ? {
        id: item.team.id,
        name: item.team.name,
        slug: item.team.slug,
        logoPicture: item.team.logoPicture,
        description: item.team.description,
      } : null,
      game: item.game ? {
        id: item.game.id,
        name: item.game.name,
        slug: item.game.slug,
        icon: item.game.icon,
      } : null,
      questions: (item.questions || []).map((q: any) => ({
        id: q.id,
        prompt: q.prompt,
        type: q.type,
        isRequired: q.isRequired,
        order: q.order,
      })),
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
      minElo: item.minElo,
      maxElo: item.maxElo,
      isPublished: item.isPublished,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
