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
      positions: (item.positions || []).map((p: any) => ({
        id: p.id,
        name: p.position?.name || 'Position',
        order: p.order,
      })),
      ranks: (item.ranks || []).map((r: any) => ({
        id: r.id,
        name: r.rank?.name || 'Rank',
        order: r.order,
      })),
      minElo: item.minElo,
      maxElo: item.maxElo,
      isPublished: item.isPublished,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
