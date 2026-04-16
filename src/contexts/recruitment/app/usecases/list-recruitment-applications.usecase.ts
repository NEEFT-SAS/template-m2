import { Inject, Injectable } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import { RecruitmentNotFoundError } from '../../domain/errors/recruitment.errors';
import { RecruitmentAccessService } from '../services/recruitment-access.service';
import { mapRecruitmentApplicationPresenter } from '../services/recruitment-application.presenter';

@Injectable()
export class ListRecruitmentApplicationsUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
    private readonly access: RecruitmentAccessService,
  ) {}

  async execute(recruitmentId: string, requesterProfileId: string) {
    const recruitment = await this.repo.findById(recruitmentId);
    if (!recruitment) {
      throw new RecruitmentNotFoundError(recruitmentId);
    }

    await this.access.ensureCanManageRecruitment(recruitment, requesterProfileId);

    const applications = await this.repo.listApplications(recruitment.id);
    const candidateIds = applications
      .map((application: any) => String(application.candidateId ?? application.candidate?.id ?? '').trim())
      .filter(Boolean);
    const candidateGames = recruitment.gameId
      ? await this.repo.findPlayerGamesForCandidates(candidateIds, recruitment.gameId)
      : new Map<string, any>();

    return applications.map((application: any) => {
      const candidateId = String(application.candidateId ?? application.candidate?.id ?? '').trim();
      return mapRecruitmentApplicationPresenter(application, candidateGames.get(candidateId) ?? null);
    });
  }
}
