import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruitmentEntity } from '../entities/recruitment.entity';
import { RecruitmentQuestionEntity } from '../entities/recruitment-question.entity';
import { RecruitmentApplicationEntity } from '../entities/recruitment-application.entity';
import { RecruitmentRepositoryPort, CreateRecruitmentInput, UpdateRecruitmentInput } from '@/contexts/recruitment/app/ports/recruitment.repository.port';

@Injectable()
export class RecruitmentRepositoryTypeorm implements RecruitmentRepositoryPort {
  constructor(
    @InjectRepository(RecruitmentEntity)
    private readonly recruitmentRepo: Repository<RecruitmentEntity>,
    @InjectRepository(RecruitmentApplicationEntity)
    private readonly applicationRepo: Repository<RecruitmentApplicationEntity>,
    @InjectRepository(RecruitmentQuestionEntity)
    private readonly questionRepo: Repository<RecruitmentQuestionEntity>,
  ) { }

  async search(query: any): Promise<{ items: any[]; total: number }> {
    const qb = this.recruitmentRepo.createQueryBuilder('recruitment');
    qb.leftJoinAndSelect('recruitment.team', 'team');
    qb.leftJoinAndSelect('recruitment.game', 'game');

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
      // By default or "recent"
      qb.orderBy('recruitment.createdAt', 'DESC');
    }

    const [items, total] = await qb
      .skip(query.offset || 0)
      .take(query.limit || 20)
      .getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<any | null> {
    return this.recruitmentRepo.findOne({
      where: { id },
      relations: ['team', 'questions', 'game', 'positions', 'ranks', 'minRank', 'maxRank'],
    });
  }

  async existsSlug(teamId: string, slug: string): Promise<boolean> {
    return this.recruitmentRepo.exists({ where: { teamId, slug } });
  }

  async create(input: CreateRecruitmentInput): Promise<any> {
    const recruitment = this.recruitmentRepo.create({
      teamId: input.teamId,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      description: input.description,
      urgent: input.urgent,
      isPaid: input.isPaid,
      missions: input.missions,
      target: input.target as any, // Enum mapping
      gameId: input.gameId,
      minElo: input.minElo,
      maxElo: input.maxElo,
      isPublished: input.isPublished,
      questions: (input.questions || []).map(q => this.questionRepo.create({
        prompt: q.prompt,
        type: q.type as any,
        isRequired: q.isRequired,
        order: q.order,
      })),
    });

    if (input.positionIds) {
      recruitment.positions = input.positionIds.map(id => ({ id } as any));
    }
    if (input.rankIds) {
      recruitment.ranks = input.rankIds.map(id => ({ id } as any));
    }
    if (input.minRankId) recruitment.minRank = { id: input.minRankId } as any;
    if (input.maxRankId) recruitment.maxRank = { id: input.maxRankId } as any;

    return this.recruitmentRepo.save(recruitment);
  }

  async update(id: string, input: UpdateRecruitmentInput): Promise<any> {
    const existing = await this.findById(id);
    if (!existing) return null;

    // Direct updates
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

    // Relations
    if (input.positionIds) {
      existing.positions = input.positionIds.map(id => ({ id } as any));
    }
    if (input.rankIds) {
      existing.ranks = input.rankIds.map(id => ({ id } as any));
    }
    if (input.minRankId !== undefined) existing.minRank = input.minRankId ? { id: input.minRankId } as any : null;
    if (input.maxRankId !== undefined) existing.maxRank = input.maxRankId ? { id: input.maxRankId } as any : null;

    // For questions, it's more complex (cascade/overwrite). 
    // In V3 it was often an overwrite.
    if (input.questions) {
      await this.questionRepo.delete({ recruitmentId: id });
      existing.questions = input.questions.map(q => this.questionRepo.create({
        recruitmentId: id,
        prompt: q.prompt,
        type: q.type as any,
        isRequired: q.isRequired,
        order: q.order,
      }));
    }

    return this.recruitmentRepo.save(existing);
  }

  async delete(id: string): Promise<void> {
    await this.recruitmentRepo.delete(id);
  }

  async findApplicationById(id: string): Promise<any | null> {
    return this.applicationRepo.findOne({
      where: { id },
      relations: ['candidate', 'answers', 'answers.question', 'recruitment', 'recruitment.team'],
    });
  }

  async saveApplication(application: any): Promise<any> {
    return this.applicationRepo.save(application);
  }

  async listApplications(recruitmentId: string): Promise<any[]> {
    return this.applicationRepo.find({
      where: { recruitment: { id: recruitmentId } },
      relations: ['candidate', 'answers', 'answers.question'],
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
}
