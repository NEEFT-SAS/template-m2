import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PlayerReportPresenter, UpdatePlayerReportStatusDTO } from '@neeft-sas/shared';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { PlayerReportNotFoundError } from '../../../domain/errors/player-report.errors';

@Injectable()
export class UpdatePlayerReportStatusUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly repo: PlayerRepositoryPort,
  ) {}

  async execute(userSlug: string, reportId: string, dto: UpdatePlayerReportStatusDTO): Promise<PlayerReportPresenter> {
    const profileId = await this.repo.findProfileIdBySlug(userSlug);
    if (!profileId) {
      throw new PlayerNotFoundError(userSlug);
    }

    const existing = await this.repo.findPlayerReportById(profileId, reportId);
    if (!existing) {
      throw new PlayerReportNotFoundError(userSlug, reportId);
    }

    const updated = await this.repo.updatePlayerReportStatus(profileId, reportId, dto.status);
    if (!updated) {
      throw new PlayerReportNotFoundError(userSlug, reportId);
    }

    return plainToInstance(PlayerReportPresenter, updated, { excludeExtraneousValues: true });
  }
}
