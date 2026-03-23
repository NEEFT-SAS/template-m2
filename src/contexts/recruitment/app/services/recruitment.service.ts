import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import { RecruitmentNotFoundError, RecruitmentApplicationNotFoundError } from '../../domain/errors/recruitment.errors';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly recruitmentRepo: RecruitmentRepositoryPort,
  ) { }

  async searchRecruitments(query: any) {
    const { items, total } = await this.recruitmentRepo.search(query);
    return {
      items: items.map((item) => this.toPresenter(item)),
      total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    };
  }

  async getRecruitment(id: string) {
    const recruitment = await this.recruitmentRepo.findById(id);
    if (!recruitment) {
      throw new RecruitmentNotFoundError(id);
    }
    return this.toPresenter(recruitment);
  }

  // Presentation logic will go here
  private toPresenter(item: any) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      description: item.description,
      urgent: item.urgent,
      isPaid: item.isPaid,
      target: item.target,
      team: item.team ? {
        id: item.team.id,
        name: item.team.name,
        slug: item.team.slug,
        icon: item.team.icon,
      } : null,
      game: item.game ? {
        id: item.game.id,
        name: item.game.name,
        slug: item.game.slug,
        icon: item.game.icon,
      } : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
