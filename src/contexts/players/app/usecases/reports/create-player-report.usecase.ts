import { Inject, Injectable } from '@nestjs/common';
import { CreatePlayerReportDTO, PlayerReportPresenter } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerReportSelfError } from '../../../domain/errors/player-report.errors';

@Injectable()
export class CreatePlayerReportUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(reporterSlug: string, targetSlug: string, dto: CreatePlayerReportDTO): Promise<PlayerReportPresenter> {
    const reporterProfileId = await this.repo.findProfileIdBySlug(reporterSlug);
    if (!reporterProfileId) {
      throw new PlayerNotFoundError(reporterSlug);
    }

    const targetProfileId = await this.repo.findProfileIdBySlug(targetSlug);
    if (!targetProfileId) {
      throw new PlayerNotFoundError(targetSlug);
    }

    if (reporterProfileId === targetProfileId) {
      throw new PlayerReportSelfError(reporterSlug, targetSlug);
    }

    return this.repo.createPlayerReport({
      reporterProfileId,
      targetProfileId,
      reason: dto.reason,
      details: dto.details,
    });
  }
}
