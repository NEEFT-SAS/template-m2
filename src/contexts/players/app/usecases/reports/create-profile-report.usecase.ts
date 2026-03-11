import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CreateProfileReportDto, ProfileReportPresenter } from '@neeft-sas/shared';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '@/contexts/teams/app/ports/team.repository.port';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';
import { PLAYER_REPOSITORY, PlayerRepositoryPort } from '../../ports/player.repository.port';
import { PlayerNotFoundError } from '../../../domain/errors/player-profile.errors';
import { ProfileReportDuplicateError, ProfileReportSelfError } from '../../../domain/errors/profile-report.errors';
import { ReportStatusEnum, ReportTargetType } from '../../../domain/types/profile-report.types';
import { ProfileReportEntity } from '../../../infra/entities/profile/profile-report.entity';

@Injectable()
export class CreateProfileReportUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY) private readonly playerRepo: PlayerRepositoryPort,
    @Inject(TEAM_REPOSITORY) private readonly teamRepo: TeamRepositoryPort,
    @InjectRepository(ProfileReportEntity) private readonly reportsRepo: Repository<ProfileReportEntity>,
  ) {}

  async execute(
    reporterSlug: string,
    targetType: ReportTargetType,
    targetSlug: string,
    dto: CreateProfileReportDto,
  ): Promise<ProfileReportPresenter> {
    const reporterProfileId = await this.playerRepo.findProfileIdBySlug(reporterSlug);
    if (!reporterProfileId) {
      throw new PlayerNotFoundError(reporterSlug);
    }

    const slug = targetSlug.trim();

    if (targetType === 'user') {
      const targetProfileId = await this.playerRepo.findProfileIdBySlug(slug);
      if (!targetProfileId) {
        throw new PlayerNotFoundError(slug);
      }

      if (reporterProfileId === targetProfileId) {
        throw new ProfileReportSelfError(reporterSlug, slug);
      }

      const exists = await this.reportsRepo.exists({
        where: {
          reporterProfile: { id: reporterProfileId },
          targetType,
          reason: dto.reason,
          status: ReportStatusEnum.PENDING,
          reportedUserProfile: { id: targetProfileId },
        },
      });

      if (exists) {
        throw new ProfileReportDuplicateError(targetType, slug, dto.reason);
      }

      const entity = this.reportsRepo.create({
        targetType,
        reason: dto.reason,
        message: dto.message?.trim() || null,
        status: ReportStatusEnum.PENDING,
        reporterProfile: { id: reporterProfileId },
        reportedUserProfile: { id: targetProfileId },
        reportedTeam: null,
      });

      const saved = await this.reportsRepo.save(entity);
      return plainToInstance(ProfileReportPresenter, saved, { excludeExtraneousValues: true });
    }

    const team = await this.teamRepo.findTeamBySlug(slug);
    if (!team) {
      throw new TeamNotFoundError(slug);
    }

    const exists = await this.reportsRepo.exists({
      where: {
        reporterProfile: { id: reporterProfileId },
        targetType,
        reason: dto.reason,
        status: ReportStatusEnum.PENDING,
        reportedTeam: { id: team.id },
      },
    });

    if (exists) {
      throw new ProfileReportDuplicateError(targetType, slug, dto.reason);
    }

    const entity = this.reportsRepo.create({
      targetType,
      reason: dto.reason,
      message: dto.message?.trim() || null,
      status: ReportStatusEnum.PENDING,
      reporterProfile: { id: reporterProfileId },
      reportedUserProfile: null,
      reportedTeam: { id: team.id },
    });

    const saved = await this.reportsRepo.save(entity);
    return plainToInstance(ProfileReportPresenter, saved, { excludeExtraneousValues: true });
  }
}
