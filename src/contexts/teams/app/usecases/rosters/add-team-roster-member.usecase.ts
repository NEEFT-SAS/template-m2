import { Inject, Injectable } from '@nestjs/common';
import {
  CreateTeamRosterMemberDTO,
  TeamRosterMemberPresenter,
} from '@neeft-sas/shared';
import { ResourcesStore } from '@/contexts/resources/infra/cache/resources.store';
import {
  TEAM_REPOSITORY,
  TeamRepositoryPort,
} from '../../ports/team.repository.port';
import {
  TeamMemberNotFoundError,
  TeamNotFoundError,
  TeamRosterInvalidGameError,
  TeamRosterInvalidPositionError,
  TeamRosterMemberAlreadyExistsError,
  TeamRosterNotFoundError,
} from '../../../domain/errors/team.errors';
import { plainToInstance } from 'class-transformer';
import { TeamScoreService } from '../../services/team-score.service';

@Injectable()
export class AddTeamRosterMemberUseCase {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
    private readonly resourcesStore: ResourcesStore,
    private readonly teamScoreService: TeamScoreService,
  ) {}

  async execute(
    teamId: string,
    rosterId: string,
    dto: CreateTeamRosterMemberDTO,
  ): Promise<TeamRosterMemberPresenter> {
    const team = await this.repo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const roster = await this.repo.findRosterById(teamId, rosterId);
    if (!roster) {
      throw new TeamRosterNotFoundError(teamId, rosterId);
    }

    const member = await this.repo.findTeamMemberById(teamId, dto.memberId);
    if (!member) {
      throw new TeamMemberNotFoundError(teamId, dto.memberId);
    }

    const existing = await this.repo.findRosterMemberByRosterAndMember(
      rosterId,
      dto.memberId,
    );
    if (existing) {
      throw new TeamRosterMemberAlreadyExistsError(rosterId, dto.memberId);
    }

    const positionId = dto.positionId ?? null;
    if (positionId !== null && positionId !== undefined) {
      const snapshot = this.resourcesStore.getSnapshot();
      const gameId = roster.gameId ?? roster.game?.id ?? 0;
      const game = snapshot.rscGames.find((item) => item.id === gameId);
      if (!game) {
        throw new TeamRosterInvalidGameError(gameId);
      }

      const allowedPositions = new Set(
        game.rscGamePositions.map((item) => item.id),
      );
      if (!allowedPositions.has(positionId)) {
        throw new TeamRosterInvalidPositionError(positionId, gameId);
      }
    }

    const created = await this.repo.createRosterMember(rosterId, {
      memberId: dto.memberId,
      role: dto.role ?? null,
      title: dto.title ?? null,
      positionId,
      isHidden: dto.isHidden ?? false,
      permissions: Number(dto.permissions ?? 0),
    });

    await this.teamScoreService.recomputeTeamScores(teamId);

    return plainToInstance(TeamRosterMemberPresenter, created, {
      excludeExtraneousValues: true,
    });
  }
}
