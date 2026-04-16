import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RecruitmentEntity } from '../entities/recruitment.entity';
import { RecruitmentQuestionEntity } from '../entities/recruitment-question.entity';
import { RecruitmentApplicationEntity } from '../entities/recruitment-application.entity';
import {
  RecruitmentRepositoryPort,
  CreateRecruitmentApplicationInput,
  CreateRecruitmentInput,
  UpdateRecruitmentInput,
} from '@/contexts/recruitment/app/ports/recruitment.repository.port';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { UserGameEntity } from '@/contexts/players/infra/entities/game/user-game.entity';
import { RscGamePlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-platforms.entity';
import { RscGamePositionEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-positions.entity';
import { RscGameRankEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-ranks.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { TEAM_MEMBER_PERMISSIONS } from '@/contexts/teams/domain/team-member.permissions';
import {
  RecruitmentGameRequiredError,
  RecruitmentInvalidGameSelectionError,
} from '@/contexts/recruitment/domain/errors/recruitment.errors';

@Injectable()
export class RecruitmentRepositoryTypeorm implements RecruitmentRepositoryPort {
  private readonly recruitmentListRelations = [
    'team',
    'game',
    'platforms',
    'platforms.platform',
    'positions',
    'positions.position',
    'ranks',
    'ranks.rank',
    'minRank',
    'minRank.rank',
    'maxRank',
    'maxRank.rank',
  ] as const;

  private readonly recruitmentDetailsRelations = [
    ...this.recruitmentListRelations,
    'questions',
  ] as const;

  constructor(
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepo: Repository<RecruitmentEntity>,
    @InjectRepository(RecruitmentApplicationEntity)
    private readonly applicationRepo: Repository<RecruitmentApplicationEntity>,
    @InjectRepository(RecruitmentQuestionEntity)
    private readonly questionRepo: Repository<RecruitmentQuestionEntity>,
  ) {}

  async search(query: any): Promise<{ items: any[]; total: number }> {
    const qb = this.recruitmentRepo.createQueryBuilder('recruitment');
    qb.leftJoin('recruitment.team', 'team');

    qb.andWhere('recruitment.is_published = true');

    if (query.q) {
      qb.andWhere('(recruitment.title LIKE :search OR recruitment.slug LIKE :search OR team.name LIKE :search)', {
        search: `%${query.q}%`,
      });
    }

    if (query.gameId !== undefined && query.gameId !== null) {
      qb.andWhere('recruitment.game_id = :gameId', { gameId: query.gameId });
    }

    if (query.target) {
      qb.andWhere('recruitment.target = :target', { target: query.target.toUpperCase() });
    }

    if (query.isPaid !== undefined && query.isPaid !== null) {
      qb.andWhere('recruitment.is_paid = :isPaid', { isPaid: query.isPaid === 'true' || query.isPaid === true });
    }

    if (query.urgent !== undefined && query.urgent !== null) {
      qb.andWhere('recruitment.urgent = :urgent', { urgent: query.urgent === 'true' || query.urgent === true });
    }

    if (query.sortBy === 'urgent') {
      qb.orderBy('recruitment.urgent', 'DESC');
      qb.addOrderBy('recruitment.createdAt', 'DESC');
    } else {
      qb.orderBy('recruitment.createdAt', 'DESC');
    }

    const [rows, total] = await qb.skip(query.offset || 0).take(query.limit || 20).getManyAndCount();

    if (!rows.length) {
      return { items: [], total };
    }

    const orderedIds = rows.map((row) => row.id);
    const detailedRows = await this.recruitmentRepo.find({
      where: { id: In(orderedIds) },
      relations: [...this.recruitmentListRelations],
    });

    const byId = new Map(detailedRows.map((row) => [row.id, row]));
    const items = orderedIds.map((id) => byId.get(id)).filter((row): row is RecruitmentEntity => Boolean(row));

    return { items, total };
  }

  async findById(id: string): Promise<any | null> {
    return this.recruitmentRepo.findOne({
      where: { id },
      relations: [...this.recruitmentDetailsRelations],
    });
  }

  async existsSlug(teamId: string, slug: string): Promise<boolean> {
    return this.recruitmentRepo.exists({ where: { teamId, slug } });
  }

  async create(input: CreateRecruitmentInput): Promise<any> {
    const resolvedPlatformIds = await this.resolveGamePlatformRelationIds(input.gameId, input.platformIds);
    const resolvedPositionIds = await this.resolveGamePositionRelationIds(input.gameId, input.positionIds);
    const resolvedRankIds = await this.resolveGameRankRelationIds(input.gameId, input.rankIds, 'rankIds');
    const resolvedMinRankId = await this.resolveSingleGameRankRelationId(input.gameId, input.minRankId, 'minRankId');
    const resolvedMaxRankId = await this.resolveSingleGameRankRelationId(input.gameId, input.maxRankId, 'maxRankId');

    const recruitment = this.recruitmentRepo.create({
      teamId: input.teamId,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      description: input.description,
      urgent: input.urgent,
      isPaid: input.isPaid,
      missions: input.missions,
      target: input.target as any,
      gameId: input.gameId,
      minElo: input.minElo,
      maxElo: input.maxElo,
      isPublished: input.isPublished,
      questions: (input.questions || []).map((q) =>
        this.questionRepo.create({
          prompt: q.prompt,
          type: q.type as any,
          isRequired: q.isRequired,
          order: q.order,
        }),
      ),
    });

    if (resolvedPlatformIds !== undefined) {
      recruitment.platforms = resolvedPlatformIds.map((id) => ({ id } as any));
    }

    if (resolvedPositionIds !== undefined) {
      recruitment.positions = resolvedPositionIds.map((id) => ({ id } as any));
    }

    if (resolvedRankIds !== undefined) {
      recruitment.ranks = resolvedRankIds.map((id) => ({ id } as any));
    }

    if (resolvedMinRankId !== undefined) {
      recruitment.minRank = resolvedMinRankId ? ({ id: resolvedMinRankId } as any) : null;
    }

    if (resolvedMaxRankId !== undefined) {
      recruitment.maxRank = resolvedMaxRankId ? ({ id: resolvedMaxRankId } as any) : null;
    }

    return this.recruitmentRepo.save(recruitment);
  }

  async update(id: string, input: UpdateRecruitmentInput): Promise<any> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const previousGameId = existing.gameId;
    const effectiveGameId = input.gameId !== undefined ? input.gameId : previousGameId;
    const gameChanged = input.gameId !== undefined && input.gameId !== previousGameId;

    const resolvedPlatformIds = await this.resolveGamePlatformRelationIds(effectiveGameId, input.platformIds);
    const resolvedPositionIds = await this.resolveGamePositionRelationIds(effectiveGameId, input.positionIds);
    const resolvedRankIds = await this.resolveGameRankRelationIds(effectiveGameId, input.rankIds, 'rankIds');
    const resolvedMinRankId = await this.resolveSingleGameRankRelationId(effectiveGameId, input.minRankId, 'minRankId');
    const resolvedMaxRankId = await this.resolveSingleGameRankRelationId(effectiveGameId, input.maxRankId, 'maxRankId');

    if (input.title !== undefined) existing.title = input.title;
    if (input.summary !== undefined) existing.summary = input.summary;
    if (input.description !== undefined) existing.description = input.description;
    if (input.urgent !== undefined) existing.urgent = input.urgent;
    if (input.isPaid !== undefined) existing.isPaid = input.isPaid;
    if (input.missions !== undefined) existing.missions = input.missions;
    if (input.target !== undefined) existing.target = input.target as any;
    if (input.gameId !== undefined) existing.gameId = input.gameId;
    if (input.minElo !== undefined) existing.minElo = input.minElo;
    if (input.maxElo !== undefined) existing.maxElo = input.maxElo;
    if (input.isPublished !== undefined) existing.isPublished = input.isPublished;

    if (resolvedPlatformIds !== undefined) {
      existing.platforms = resolvedPlatformIds.map((id) => ({ id } as any));
    } else if (gameChanged) {
      existing.platforms = [];
    }

    if (resolvedPositionIds !== undefined) {
      existing.positions = resolvedPositionIds.map((id) => ({ id } as any));
    } else if (gameChanged) {
      existing.positions = [];
    }

    if (resolvedRankIds !== undefined) {
      existing.ranks = resolvedRankIds.map((id) => ({ id } as any));
    } else if (gameChanged) {
      existing.ranks = [];
    }

    if (resolvedMinRankId !== undefined) {
      existing.minRank = resolvedMinRankId ? ({ id: resolvedMinRankId } as any) : null;
    } else if (gameChanged) {
      existing.minRank = null;
    }

    if (resolvedMaxRankId !== undefined) {
      existing.maxRank = resolvedMaxRankId ? ({ id: resolvedMaxRankId } as any) : null;
    } else if (gameChanged) {
      existing.maxRank = null;
    }

    if (input.questions) {
      await this.questionRepo.delete({ recruitmentId: id });
      existing.questions = input.questions.map((q) =>
        this.questionRepo.create({
          recruitmentId: id,
          prompt: q.prompt,
          type: q.type as any,
          isRequired: q.isRequired,
          order: q.order,
        }),
      );
    }

    return this.recruitmentRepo.save(existing);
  }

  async delete(id: string): Promise<void> {
    await this.recruitmentRepo.delete(id);
  }

  async findApplicationById(id: string): Promise<any | null> {
    return this.applicationRepo.findOne({
      where: { id },
      relations: [
        'candidate',
        'answers',
        'answers.question',
        'position',
        'position.position',
        'recruitment',
        'recruitment.team',
        'recruitment.game',
      ],
    });
  }

  async findApplicationByRecruitmentAndCandidate(recruitmentId: string, candidateId: string): Promise<any | null> {
    return this.applicationRepo.findOne({
      where: { recruitmentId, candidateId },
    });
  }

  async findCandidateProfileById(candidateId: string): Promise<any | null> {
    return this.recruitmentRepo.manager.getRepository(UserProfileEntity).findOne({
      where: { id: candidateId },
    });
  }

  async findRecruitmentManagerProfileIds(teamId: string, excludedProfileIds: string[] = []): Promise<string[]> {
    const excluded = new Set(
      excludedProfileIds
        .map((profileId) => String(profileId ?? '').trim())
        .filter(Boolean),
    );
    const recipients = new Set<string>();

    const team = await this.recruitmentRepo.manager.getRepository(TeamEntity).findOne({
      where: { id: teamId },
      relations: ['owner'],
    });

    const ownerId = String(team?.owner?.id ?? '').trim();
    if (ownerId && !excluded.has(ownerId)) {
      recipients.add(ownerId);
    }

    const members = await this.recruitmentRepo.manager.getRepository(TeamMemberEntity).find({
      where: { team: { id: teamId }, status: 'current' },
      relations: ['profile'],
    });

    members.forEach((member) => {
      const permissions = BigInt(member.permissions ?? 0);
      const canManageRecruitment =
        (permissions & TEAM_MEMBER_PERMISSIONS.MANAGE_RECRUITMENT) ===
        TEAM_MEMBER_PERMISSIONS.MANAGE_RECRUITMENT;
      const profileId = String(member.profile?.id ?? member.profileId ?? '').trim();

      if (canManageRecruitment && profileId && !excluded.has(profileId)) {
        recipients.add(profileId);
      }
    });

    return Array.from(recipients);
  }

  async findPlayerGameForCandidate(candidateId: string, gameId: number): Promise<any | null> {
    const gamesByCandidate = await this.findPlayerGamesForCandidates([candidateId], gameId);
    return gamesByCandidate.get(candidateId) ?? null;
  }

  async findPlayerGamesForCandidates(candidateIds: string[], gameId: number): Promise<Map<string, any>> {
    const normalizedCandidateIds = Array.from(new Set(
      candidateIds
        .map((candidateId) => String(candidateId ?? '').trim())
        .filter(Boolean),
    ));

    if (!normalizedCandidateIds.length || !Number.isInteger(gameId)) {
      return new Map();
    }

    const playerGames = await this.recruitmentRepo.manager
      .getRepository(UserGameEntity)
      .createQueryBuilder('playerGame')
      .leftJoinAndSelect('playerGame.profile', 'profile')
      .leftJoinAndSelect('playerGame.rscGame', 'rscGame')
      .leftJoinAndSelect('playerGame.positions', 'positions')
      .leftJoinAndSelect('positions.position', 'position')
      .leftJoinAndSelect('playerGame.modeRanks', 'modeRanks')
      .leftJoinAndSelect('modeRanks.mode', 'mode')
      .leftJoinAndSelect('mode.mode', 'baseMode')
      .leftJoinAndSelect('modeRanks.rank', 'rank')
      .leftJoinAndSelect('rank.rank', 'baseRank')
      .where('profile.id IN (:...candidateIds)', { candidateIds: normalizedCandidateIds })
      .andWhere('rscGame.id = :gameId', { gameId })
      .getMany();

    return new Map(
      playerGames
        .map((playerGame) => [String(playerGame.profile?.id ?? ''), playerGame] as const)
        .filter(([candidateId]) => Boolean(candidateId)),
    );
  }

  async createApplication(input: CreateRecruitmentApplicationInput): Promise<any> {
    const application = this.applicationRepo.create({
      recruitmentId: input.recruitmentId,
      candidateId: input.candidateId,
      status: 'PENDING',
      motivation: input.motivation ?? null,
      positionId: input.positionId ?? null,
      answers: (input.answers || []).map((answer) => ({
        questionId: answer.questionId,
        answerText: answer.answerText ?? null,
        answerBoolean: answer.answerBoolean ?? null,
      })) as any,
    });

    const saved = await this.applicationRepo.save(application);
    return this.findApplicationById(saved.id);
  }

  async saveApplication(application: any): Promise<any> {
    return this.applicationRepo.save(application);
  }

  async listApplications(recruitmentId: string): Promise<any[]> {
    return this.applicationRepo.find({
      where: { recruitment: { id: recruitmentId } },
      relations: [
        'candidate',
        'answers',
        'answers.question',
        'position',
        'position.position',
        'recruitment',
        'recruitment.team',
        'recruitment.game',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async listCandidateApplications(candidateId: string): Promise<any[]> {
    return this.applicationRepo.find({
      where: { candidate: { id: candidateId } },
      relations: ['recruitment', 'recruitment.team'],
      order: { createdAt: 'DESC' },
    });
  }

  async countApplicationsByRecruitmentIds(recruitmentIds: string[]): Promise<Map<string, number>> {
    if (!recruitmentIds.length) {
      return new Map();
    }

    const rows = await this.applicationRepo
      .createQueryBuilder('application')
      .select('application.recruitmentId', 'recruitmentId')
      .addSelect('COUNT(application.id)', 'count')
      .where('application.recruitmentId IN (:...recruitmentIds)', { recruitmentIds })
      .groupBy('application.recruitmentId')
      .getRawMany<{ recruitmentId: string; count: string }>();

    return new Map(rows.map((row) => [row.recruitmentId, Number(row.count) || 0]));
  }

  async findAppliedRecruitmentIds(recruitmentIds: string[], candidateId: string): Promise<Set<string>> {
    if (!recruitmentIds.length || !candidateId) {
      return new Set();
    }

    const rows = await this.applicationRepo
      .createQueryBuilder('application')
      .select('application.recruitmentId', 'recruitmentId')
      .where('application.recruitmentId IN (:...recruitmentIds)', { recruitmentIds })
      .andWhere('application.candidateId = :candidateId', { candidateId })
      .getRawMany<{ recruitmentId: string }>();

    return new Set(rows.map((row) => row.recruitmentId));
  }

  private normalizeIds(ids: number[]): number[] {
    const seen = new Set<number>();
    const unique: number[] = [];

    for (const id of ids) {
      if (!Number.isInteger(id)) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(id);
    }

    return unique;
  }

  private async resolveGamePlatformRelationIds(
    gameId: number | null | undefined,
    rawIds?: number[],
  ): Promise<number[] | undefined> {
    if (rawIds === undefined) return undefined;

    const ids = this.normalizeIds(rawIds);
    if (!ids.length) return [];

    if (!gameId) {
      throw new RecruitmentGameRequiredError('platformIds');
    }

    const relationRepo = this.recruitmentRepo.manager.getRepository(RscGamePlatformEntity);

    const byBaseRows = await relationRepo.find({
      where: { gameId, rscPlatformId: In(ids) },
      select: ['id', 'rscPlatformId'],
    });
    const byBase = new Map<number, number>(byBaseRows.map((row) => [row.rscPlatformId, row.id]));

    const resolved: number[] = [];
    const unresolved: number[] = [];
    for (const id of ids) {
      const mapped = byBase.get(id);
      if (mapped) resolved.push(mapped);
      else unresolved.push(id);
    }

    if (!unresolved.length) {
      return resolved;
    }

    const byRelationRows = await relationRepo.find({
      where: { gameId, id: In(unresolved) },
      select: ['id'],
    });
    const byRelation = new Set(byRelationRows.map((row) => row.id));

    const invalidIds: number[] = [];
    for (const id of unresolved) {
      if (byRelation.has(id)) resolved.push(id);
      else invalidIds.push(id);
    }

    if (invalidIds.length) {
      throw new RecruitmentInvalidGameSelectionError('platformIds', gameId, invalidIds);
    }

    return resolved;
  }

  private async resolveGamePositionRelationIds(
    gameId: number | null | undefined,
    rawIds?: number[],
  ): Promise<number[] | undefined> {
    if (rawIds === undefined) return undefined;

    const ids = this.normalizeIds(rawIds);
    if (!ids.length) return [];

    if (!gameId) {
      throw new RecruitmentGameRequiredError('positionIds');
    }

    const relationRepo = this.recruitmentRepo.manager.getRepository(RscGamePositionEntity);

    const byBaseRows = await relationRepo.find({
      where: { gameId, rscPositionId: In(ids) },
      select: ['id', 'rscPositionId'],
    });
    const byBase = new Map<number, number>(byBaseRows.map((row) => [row.rscPositionId, row.id]));

    const resolved: number[] = [];
    const unresolved: number[] = [];
    for (const id of ids) {
      const mapped = byBase.get(id);
      if (mapped) resolved.push(mapped);
      else unresolved.push(id);
    }

    if (!unresolved.length) {
      return resolved;
    }

    const byRelationRows = await relationRepo.find({
      where: { gameId, id: In(unresolved) },
      select: ['id'],
    });
    const byRelation = new Set(byRelationRows.map((row) => row.id));

    const invalidIds: number[] = [];
    for (const id of unresolved) {
      if (byRelation.has(id)) resolved.push(id);
      else invalidIds.push(id);
    }

    if (invalidIds.length) {
      throw new RecruitmentInvalidGameSelectionError('positionIds', gameId, invalidIds);
    }

    return resolved;
  }

  private async resolveGameRankRelationIds(
    gameId: number | null | undefined,
    rawIds: number[] | undefined,
    field: 'rankIds' | 'minRankId' | 'maxRankId',
  ): Promise<number[] | undefined> {
    if (rawIds === undefined) return undefined;

    const ids = this.normalizeIds(rawIds);
    if (!ids.length) return [];

    if (!gameId) {
      throw new RecruitmentGameRequiredError(field);
    }

    const relationRepo = this.recruitmentRepo.manager.getRepository(RscGameRankEntity);

    const byBaseRows = await relationRepo.find({
      where: { gameId, rscRankId: In(ids) },
      select: ['id', 'rscRankId'],
    });
    const byBase = new Map<number, number>(byBaseRows.map((row) => [row.rscRankId, row.id]));

    const resolved: number[] = [];
    const unresolved: number[] = [];
    for (const id of ids) {
      const mapped = byBase.get(id);
      if (mapped) resolved.push(mapped);
      else unresolved.push(id);
    }

    if (!unresolved.length) {
      return resolved;
    }

    const byRelationRows = await relationRepo.find({
      where: { gameId, id: In(unresolved) },
      select: ['id'],
    });
    const byRelation = new Set(byRelationRows.map((row) => row.id));

    const invalidIds: number[] = [];
    for (const id of unresolved) {
      if (byRelation.has(id)) resolved.push(id);
      else invalidIds.push(id);
    }

    if (invalidIds.length) {
      throw new RecruitmentInvalidGameSelectionError(field, gameId, invalidIds);
    }

    return resolved;
  }

  private async resolveSingleGameRankRelationId(
    gameId: number | null | undefined,
    rawId: number | null | undefined,
    field: 'minRankId' | 'maxRankId',
  ): Promise<number | null | undefined> {
    if (rawId === undefined) return undefined;
    if (rawId === null) return null;

    const resolved = await this.resolveGameRankRelationIds(gameId, [rawId], field);
    return resolved?.[0] ?? null;
  }
}
