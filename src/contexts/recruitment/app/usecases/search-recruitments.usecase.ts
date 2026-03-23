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
      createdAt: item.createdAt,
    };
  }
}
