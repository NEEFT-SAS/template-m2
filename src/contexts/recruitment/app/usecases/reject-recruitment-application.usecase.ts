import { Inject, Injectable } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import { RejectRecruitmentApplicationDto } from '../../api/dtos/recruitment-application-status.dto';
import {
  RecruitmentApplicationNotFoundError,
  RecruitmentNotFoundError,
} from '../../domain/errors/recruitment.errors';
import { RecruitmentAccessService } from '../services/recruitment-access.service';
import {
  mapRecruitmentApplicationPresenter,
  resolveApplicationCandidateGame,
} from '../services/recruitment-application.presenter';

@Injectable()
export class RejectRecruitmentApplicationUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
    private readonly access: RecruitmentAccessService,
  ) {}

  async execute(
    recruitmentId: string,
    applicationId: string,
    requesterProfileId: string,
    dto: RejectRecruitmentApplicationDto,
  ) {
    const recruitment = await this.repo.findById(recruitmentId);
    if (!recruitment) {
      throw new RecruitmentNotFoundError(recruitmentId);
    }

    await this.access.ensureCanManageRecruitment(recruitment, requesterProfileId);

    const application = await this.repo.findApplicationById(applicationId);
    if (!application || String(application.recruitmentId ?? application.recruitment?.id) !== recruitment.id) {
      throw new RecruitmentApplicationNotFoundError(applicationId);
    }

    application.status = 'REJECTED';
    application.rejectReason = dto.message;
    await this.repo.saveApplication(application);

    const updatedApplication = await this.repo.findApplicationById(application.id);
    const candidateGame = await resolveApplicationCandidateGame(this.repo, updatedApplication);
    return mapRecruitmentApplicationPresenter(updatedApplication, candidateGame);
  }
}
