import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '@/contexts/teams/app/ports/team.repository.port';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import { CreateRecruitmentDto } from '../../api/dtos/create-recruitment.dto';
import { RecruitmentAccessDeniedError, RecruitmentNotFoundError } from '../../domain/errors/recruitment.errors';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';

@Injectable()
export class UpdateRecruitmentUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepo: TeamRepositoryPort,
  ) { }

  async execute(requesterProfileId: string, id: string, dto: Partial<CreateRecruitmentDto>) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new RecruitmentNotFoundError(id);
    }

    const teamId = existing.teamId;

    // Permission check
    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const isOwner = team.owner?.id === requesterProfileId;
    let hasPermission = isOwner;

    if (!isOwner) {
      const member = await this.teamRepo.findTeamMemberByProfile(teamId, requesterProfileId);
      if (member && (member.permissions & TEAM_MEMBER_PERMISSIONS.MANAGE_RECRUITMENT)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new RecruitmentAccessDeniedError();
    }

    const updated = await this.repo.update(id, {
      title: dto.title,
      summary: dto.summary,
      description: dto.description,
      urgent: dto.urgent,
      isPaid: dto.isPaid,
      missions: dto.missions,
      target: dto.target,
      gameId: dto.gameId,
      positionIds: dto.positionIds,
      rankIds: dto.rankIds,
      minElo: dto.minElo,
      maxElo: dto.maxElo,
      minRankId: dto.minRankId,
      maxRankId: dto.maxRankId,
      isPublished: dto.isPublished,
      questions: dto.questions?.map((q, index) => ({
        prompt: q.title,
        type: q.type,
        isRequired: q.required ?? false,
        order: index,
      })),
    });

    return updated;
  }
}
