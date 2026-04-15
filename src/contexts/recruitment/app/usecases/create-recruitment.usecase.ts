import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { slugifyUnique } from '@neeft-sas/shared';
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
import { RecruitmentAccessDeniedError } from '../../domain/errors/recruitment.errors';
import { TeamNotFoundError } from '@/contexts/teams/domain/errors/team.errors';

@Injectable()
export class CreateRecruitmentUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepo: TeamRepositoryPort,
  ) { }

  async execute(requesterProfileId: string, teamId: string, dto: CreateRecruitmentDto) {
    const team = await this.teamRepo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Permission check
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

    // Slug generation
    const slug = await slugifyUnique(
      dto.title,
      async (candidate) => this.repo.existsSlug(teamId, candidate),
      { allowBaseSlug: true, suffixDigits: 3, maxRetries: 10 },
    );

    const recruitment = await this.repo.create({
      teamId,
      slug,
      title: dto.title,
      summary: dto.summary,
      description: dto.description,
      urgent: dto.urgent ?? false,
      isPaid: dto.isPaid ?? false,
      missions: dto.missions,
      target: dto.target,
      gameId: dto.gameId,
      platformIds: dto.platformIds,
      positionIds: dto.positionIds,
      rankIds: dto.rankIds,
      minElo: dto.minElo,
      maxElo: dto.maxElo,
      minRankId: dto.minRankId,
      maxRankId: dto.maxRankId,
      isPublished: dto.isPublished ?? true,
      questions: dto.questions?.map((q, index) => ({
        prompt: q.title,
        type: q.type,
        isRequired: q.required ?? false,
        order: index,
      })),
    });

    return recruitment;
  }
}
