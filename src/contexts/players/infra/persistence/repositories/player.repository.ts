import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerGameCreateInput, PlayerGameUpdateInput, PlayerProfileContext, PlayerProfileUpdatePayload, PlayerRepositoryPort, RecommendationCreateInput, RecommendationListQuery, RecommendationListResult } from '@/contexts/players/app/ports/player.repository.port';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UserSocialLinkEntity } from '../../entities/profile/user-social-link.entity';
import { PlayerAvailabilityPresenter, PlayerReportStatus, PlayerSocialLinkPresenter } from '@neeft-sas/shared';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { UserBadgeEntity } from '../../entities/profile/user-badge.entity';
import { UserProfileAvailabilityEntity } from '../../entities/profile/user-profile-availability.entity';
import { UserProfileSchoolExperienceEntity } from '../../entities/profile/user-profile-school-experience.entity';
import { UserProfileExperienceEntity } from '../../entities/profile/user-profile-experience.entity';
import { UserProfileProfessionalExperienceEntity } from '../../entities/profile/user-profile-professional-experience.entity';
import { PlayerEducationExperienceInput, PlayerEducationExperienceUpdateInput, PlayerExperienceInput, PlayerExperienceUpdateInput, PlayerProfessionalExperienceInput, PlayerProfessionalExperienceUpdateInput, PlayerReportCreateInput } from '@/contexts/players/app/ports/player.repository.port';
import { UserReportEntity } from '../../entities/profile/user-report.entity';
import { UserGameEntity } from '../../entities/game/user-game.entity';
import { UserGameLeagueOfLegendsEntity } from '../../entities/game/user-game-league-of-legends.entity';
import { UserGameRocketLeagueEntity } from '../../entities/game/user-game-rocket-league.entity';
import { UserGameValorantEntity } from '../../entities/game/user-game-valorant.entity';
import { UserGameBrawlStarsEntity } from '../../entities/game/user-game-brawl-stars.entity';
import { UserGameFortniteEntity } from '../../entities/game/user-game-fortnite.entity';
import { UserGamePositionEntity } from '../../entities/game/user-game-position.entity';
import { UserGamePlatformEntity } from '../../entities/game/user-game-platform.entity';
import { UserGameCharacterEntity } from '../../entities/game/user-game-character.entity';
import { UserGameModeRankEntity } from '../../entities/game/user-game-mode-rank.entity';
import { RscGameModeEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-modes.entity';
import { RscGameRankEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-ranks.entity';
import { RecommendationEntity } from '../../entities/recommendations/recommendation.entity';


@Injectable()
export class PlayerRepositoryTypeorm implements PlayerRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity) private readonly repo: Repository<UserProfileEntity>,
    @InjectRepository(UserCredentialsEntity) private readonly credentialsRepo: Repository<UserCredentialsEntity>,
    @InjectRepository(UserSocialLinkEntity) private readonly linksRepo: Repository<UserSocialLinkEntity>,
    @InjectRepository(UserProfileExperienceEntity) private readonly experiencesRepo: Repository<UserProfileExperienceEntity>,
    @InjectRepository(UserProfileSchoolExperienceEntity) private readonly schoolExperiencesRepo: Repository<UserProfileSchoolExperienceEntity>,
    @InjectRepository(UserProfileProfessionalExperienceEntity) private readonly professionalExperiencesRepo: Repository<UserProfileProfessionalExperienceEntity>,
    @InjectRepository(UserReportEntity) private readonly reportsRepo: Repository<UserReportEntity>,
    @InjectRepository(UserBadgeEntity) private readonly badgesRepo: Repository<UserBadgeEntity>,
    @InjectRepository(UserGameEntity) private readonly playerGamesRepo: Repository<UserGameEntity>,
    @InjectRepository(RecommendationEntity) private readonly recommendationsRepo: Repository<RecommendationEntity>,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async findPublicProfileBySlug(slug: string): Promise<UserProfileEntity | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      relations: { nationality: true, languages: true },
    });

    return entity ?? null;
  }

  async findPrivateProfileBySlug(
    slug: string,
  ): Promise<{ profile: UserProfileEntity; credentials: UserCredentialsEntity } | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      relations: { nationality: true, languages: true },
    });

    if (!entity) return null;

    const credentials = await this.credentialsRepo.findOne({
      where: { id: entity.userCredentialId },
      select: ['email'],
    });

    if (!credentials) return null;

    return { profile: entity, credentials };
  }
  
  async findProfileIdBySlug(slug: string): Promise<string | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      select: ['id'],
    });

    console.log(slug, entity);
    
    return entity ? entity.id : null;
  }

  async findProfileContextBySlug(slug: string): Promise<PlayerProfileContext | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      select: ['id', 'userCredentialId'],
    });

    return entity ? { userProfileId: entity.id, userCredentialId: entity.userCredentialId } : null;
  }

  async updateProfile(context: PlayerProfileContext, payload: PlayerProfileUpdatePayload): Promise<void> {
    const profileUpdates = payload.profile ?? {};
    const credentialsUpdates = payload.credentials ?? {};

    const hasProfileUpdates = Object.keys(profileUpdates).length > 0;
    const hasCredentialsUpdates = Object.keys(credentialsUpdates).length > 0;

    if (!hasProfileUpdates && !hasCredentialsUpdates) return;

    await this.dataSource.transaction(async (manager) => {
      if (hasProfileUpdates) {
        const { nationalityId, languageIds, ...rest } = profileUpdates;
        const profilePayload: Partial<UserProfileEntity> = {
          id: context.userProfileId,
          ...rest,
        };

        if (nationalityId !== undefined) {
          profilePayload.nationality = nationalityId ? ({ id: nationalityId } as UserProfileEntity['nationality']) : null;
        }

        if (languageIds !== undefined) {
          profilePayload.languages = languageIds ? languageIds.map((id) => ({ id } as UserProfileEntity['languages'][number])) : [];
        }

        await manager.getRepository(UserProfileEntity).save({
          ...profilePayload,
        });
      }

      if (hasCredentialsUpdates) {
        await manager.getRepository(UserCredentialsEntity).save({
          id: context.userCredentialId,
          ...credentialsUpdates,
        });
      }
    });
  }

  /*********************************
   *  Module : social links
   * 
   *********************************/
  async findSocialLinks(userProfileId: string) {
    return this.linksRepo.find({
      where: { userProfile: { id: userProfileId } },
      order: { createdAt: 'ASC' },
    });
  } 
  
  async replaceSocialLinks(userProfileId: string, links: PlayerSocialLinkPresenter[]): Promise<UserSocialLinkEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserSocialLinkEntity);

      console.log(links);
      
      await repo.delete({ userProfile: { id: userProfileId } });

      if (!links.length) return [];

      const entities = links.map((l) =>
        repo.create({
          userProfile: { id: userProfileId },
          rscSocialPlatformId: l.rscSocialPlatformId,
          username: l.username,
          url: l.url,
        }),
      );

      return repo.save(entities);
    });
  }

  async replaceAvailabilities(userProfileId: string, availabilities: PlayerAvailabilityPresenter[]): Promise<UserProfileAvailabilityEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserProfileAvailabilityEntity);

      await repo.delete({ userProfile: { id: userProfileId } });

      if (!availabilities.length) return [];

      const entities = availabilities.map((availability) =>
        repo.create({
          userProfile: { id: userProfileId },
          weekday: availability.weekday,
          slot: availability.slot,
        }),
      );

      return repo.save(entities);
    });
  }

  /**********************************
   * Module : Experiences
   * 
   ***********************************/
  async addExperience(userProfileId: string, input: PlayerExperienceInput): Promise<UserProfileExperienceEntity> {
    const entity = this.experiencesRepo.create({
      userProfile: { id: userProfileId },
      teamName: input.teamName ?? null,
      jobTitle: input.jobTitle,
      description: input.description ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
    });

    const saved = await this.experiencesRepo.save(entity);
    return saved;
  }

  async findExperiences(userProfileId: string): Promise<UserProfileExperienceEntity[]> {
    return this.experiencesRepo.find({
      where: { userProfile: { id: userProfileId } },
      order: { startDate: 'DESC', endDate: 'DESC', id: 'DESC' },
    });
  }

  async findExperienceById(userProfileId: string, experienceId: number): Promise<UserProfileExperienceEntity | null> {
    return this.experiencesRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });
  }

  async updateExperience(userProfileId: string, experienceId: number, input: PlayerExperienceUpdateInput): Promise<UserProfileExperienceEntity> {
    await this.experiencesRepo.save({
      id: experienceId,
      userProfile: { id: userProfileId },
      ...input,
    });

    const updated = await this.experiencesRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });

    if (!updated) {
      throw new Error('Experience not found');
    }

    return updated;
  }

  async deleteExperience(userProfileId: string, experienceId: number): Promise<void> {
    await this.experiencesRepo.delete({
      id: experienceId,
      userProfile: { id: userProfileId },
    });
  }

  /**********************************
   * Module : Education Experiences
   * 
   ***********************************/
  async addEducationExperience(userProfileId: string, input: PlayerEducationExperienceInput): Promise<UserProfileSchoolExperienceEntity> {
    const entity = this.schoolExperiencesRepo.create({
      profile: { id: userProfileId },
      schoolName: input.schoolName,
      schoolLogoUrl: input.schoolLogoUrl ?? null,
      diplomaName: input.diplomaName,
      description: input.description ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      location: input.location ?? null,
      educationStatus: input.educationStatus ?? null,
      attendanceMode: input.attendanceMode ?? null,
      mention: input.mention ?? null,
    });

    const saved = await this.schoolExperiencesRepo.save(entity);
    return saved;
  }

  async findEducationExperiences(userProfileId: string): Promise<UserProfileSchoolExperienceEntity[]> {
    return this.schoolExperiencesRepo.find({
      where: { profile: { id: userProfileId } },
      order: { startDate: 'DESC', endDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findEducationExperienceById(userProfileId: string, experienceId: string): Promise<UserProfileSchoolExperienceEntity | null> {
    return this.schoolExperiencesRepo.findOne({
      where: { id: experienceId, profile: { id: userProfileId } },
    });
  }

  async updateEducationExperience(userProfileId: string, experienceId: string, input: PlayerEducationExperienceUpdateInput): Promise<UserProfileSchoolExperienceEntity> {
    await this.schoolExperiencesRepo.save({
      id: experienceId,
      profile: { id: userProfileId },
      ...input,
    });

    const updated = await this.schoolExperiencesRepo.findOne({
      where: { id: experienceId, profile: { id: userProfileId } },
    });

    if (!updated) {
      throw new Error('Education experience not found');
    }

    return updated;
  }

  async deleteEducationExperience(userProfileId: string, experienceId: string): Promise<void> {
    await this.schoolExperiencesRepo.delete({
      id: experienceId,
      profile: { id: userProfileId },
    });
  }

  /**********************************
   * Module : Professional Experiences
   * 
   ***********************************/
  async addProfessionalExperience(userProfileId: string, input: PlayerProfessionalExperienceInput): Promise<UserProfileProfessionalExperienceEntity> {
    const entity = this.professionalExperiencesRepo.create({
      profile: { id: userProfileId },
      companyName: input.companyName,
      companyLogoUrl: input.companyLogoUrl ?? null,
      positionTitle: input.positionTitle,
      contractType: input.contractType ?? null,
      description: input.description ?? null,
      missions: input.missions ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      location: input.location ?? null,
    });

    const saved = await this.professionalExperiencesRepo.save(entity);
    return saved;
  }

  async findProfessionalExperiences(userProfileId: string): Promise<UserProfileProfessionalExperienceEntity[]> {
    return this.professionalExperiencesRepo.find({
      where: { profile: { id: userProfileId } },
      order: { startDate: 'DESC', endDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findProfessionalExperienceById(userProfileId: string, experienceId: string): Promise<UserProfileProfessionalExperienceEntity | null> {
    return this.professionalExperiencesRepo.findOne({
      where: { id: experienceId, profile: { id: userProfileId } },
    });
  }

  async updateProfessionalExperience(userProfileId: string, experienceId: string, input: PlayerProfessionalExperienceUpdateInput): Promise<UserProfileProfessionalExperienceEntity> {
    await this.professionalExperiencesRepo.save({
      id: experienceId,
      profile: { id: userProfileId },
      ...input,
    });

    const updated = await this.professionalExperiencesRepo.findOne({
      where: { id: experienceId, profile: { id: userProfileId } },
    });

    if (!updated) {
      throw new Error('Professional experience not found');
    }

    return updated;
  }

  async deleteProfessionalExperience(userProfileId: string, experienceId: string): Promise<void> {
    await this.professionalExperiencesRepo.delete({
      id: experienceId,
      profile: { id: userProfileId },
    });
  }

  /**********************************
   * Module : Reports
   * 
   ***********************************/
  async findPlayerReports(userProfileId: string): Promise<UserReportEntity[]> {
    return this.reportsRepo.find({
      where: { targetProfile: { id: userProfileId } },
      order: { createdAt: 'DESC', id: 'DESC' },
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findPlayerReportById(userProfileId: string, reportId: string): Promise<UserReportEntity | null> {
    return this.reportsRepo.findOne({
      where: { id: reportId, targetProfile: { id: userProfileId } },
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async createPlayerReport(input: PlayerReportCreateInput): Promise<UserReportEntity> {
    const entity = this.reportsRepo.create({
      reporterProfile: { id: input.reporterProfileId },
      targetProfile: { id: input.targetProfileId },
      reason: input.reason,
      details: input.details,
    });

    const saved = await this.reportsRepo.save(entity);
    return saved;
  }

  async updatePlayerReportStatus(userProfileId: string, reportId: string, status: PlayerReportStatus): Promise<UserReportEntity | null> {
    const res = await this.reportsRepo
      .createQueryBuilder()
      .update(UserReportEntity)
      .set({ status })
      .where('id = :reportId', { reportId })
      .andWhere('target_profile_id = :targetProfileId', { targetProfileId: userProfileId })
      .execute();

    if ((res.affected ?? 0) === 0) return null;
    return this.findPlayerReportById(userProfileId, reportId);
  }

  async createRecommendation(input: RecommendationCreateInput): Promise<RecommendationEntity> {
    const entity = this.recommendationsRepo.create({
      targetType: input.targetType,
      targetProfile: input.targetProfileId ? ({ id: input.targetProfileId } as UserProfileEntity) : null,
      targetTeam: input.targetTeamId ? ({ id: input.targetTeamId } as RecommendationEntity['targetTeam']) : null,
      authorType: input.authorType,
      authorProfile: input.authorProfileId ? ({ id: input.authorProfileId } as UserProfileEntity) : null,
      authorTeam: input.authorTeamId ? ({ id: input.authorTeamId } as RecommendationEntity['authorTeam']) : null,
      authorDisplayName: input.authorDisplayName,
      authorSlug: input.authorSlug,
      authorAvatarUrl: input.authorAvatarUrl ?? null,
      gameSlug: input.gameSlug ?? null,
      gameName: input.gameName ?? null,
      gameIconUrl: input.gameIconUrl ?? null,
      role: input.role ?? null,
      relationship: input.relationship ?? null,
      tags: input.tags ?? [],
      content: input.content,
      rating: input.rating ?? null,
    });

    const saved = await this.recommendationsRepo.save(entity);
    const reloaded = await this.recommendationsRepo.findOne({
      where: { id: saved.id },
      relations: { targetProfile: true, targetTeam: true, authorProfile: true, authorTeam: true },
    });
    return reloaded ?? saved;
  }

  async existsPlayerToPlayerRecommendation(authorProfileId: string, targetProfileId: string): Promise<boolean> {
    const exists = await this.recommendationsRepo.exists({
      where: {
        authorType: 'player',
        targetType: 'player',
        authorProfile: { id: authorProfileId },
        targetProfile: { id: targetProfileId },
      },
    });

    return !!exists;
  }

  async findRecommendationSnapshotById(recommendationId: string): Promise<{
    id: string;
    targetType: 'player' | 'team';
    targetProfileId: string | null;
    targetTeamId: string | null;
    authorType: 'player' | 'team' | 'staff';
    authorProfileId: string | null;
    authorTeamId: string | null;
  } | null> {
    const row = await this.recommendationsRepo
      .createQueryBuilder('r')
      .leftJoin('r.targetProfile', 'targetProfile')
      .leftJoin('r.targetTeam', 'targetTeam')
      .leftJoin('r.authorProfile', 'authorProfile')
      .leftJoin('r.authorTeam', 'authorTeam')
      .select('r.id', 'id')
      .addSelect('r.targetType', 'targetType')
      .addSelect('r.authorType', 'authorType')
      .addSelect('targetProfile.id', 'targetProfileId')
      .addSelect('targetTeam.id', 'targetTeamId')
      .addSelect('authorProfile.id', 'authorProfileId')
      .addSelect('authorTeam.id', 'authorTeamId')
      .where('r.id = :id', { id: recommendationId })
      .getRawOne<{
        id: string;
        targetType: 'player' | 'team';
        authorType: 'player' | 'team' | 'staff';
        targetProfileId: string | null;
        targetTeamId: string | null;
        authorProfileId: string | null;
        authorTeamId: string | null;
      }>();

    if (!row) return null;

    return {
      id: row.id,
      targetType: row.targetType,
      targetProfileId: row.targetProfileId ?? null,
      targetTeamId: row.targetTeamId ?? null,
      authorType: row.authorType,
      authorProfileId: row.authorProfileId ?? null,
      authorTeamId: row.authorTeamId ?? null,
    };
  }

  async deleteRecommendation(recommendationId: string): Promise<void> {
    await this.recommendationsRepo.delete({ id: recommendationId });
  }

  async findPlayerRecommendationsReceived(userProfileId: string, query: RecommendationListQuery): Promise<RecommendationListResult> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const base = this.recommendationsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.targetProfile', 'targetProfile')
      .leftJoinAndSelect('r.targetTeam', 'targetTeam')
      .leftJoinAndSelect('r.authorProfile', 'authorProfile')
      .leftJoinAndSelect('r.authorTeam', 'authorTeam')
      .where('r.targetType = :targetType', { targetType: 'player' })
      .andWhere('targetProfile.id = :userProfileId', { userProfileId });

    const [items, total] = await base
      .orderBy('r.createdAt', 'DESC')
      .addOrderBy('r.id', 'DESC')
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    const statsQuery = this.recommendationsRepo
      .createQueryBuilder('r')
      .leftJoin('r.targetProfile', 'targetProfile')
      .select('AVG(r.rating)', 'ratingAverage')
      .addSelect('COUNT(r.rating)', 'ratingCount')
      .addSelect('COALESCE(SUM(r.rating), 0)', 'ratingSum')
      .where('r.targetType = :targetType', { targetType: 'player' })
      .andWhere('targetProfile.id = :userProfileId', { userProfileId })
      .andWhere('r.rating IS NOT NULL');

    const stats = await statsQuery.getRawOne<{
      ratingAverage: string | null;
      ratingCount: string | null;
      ratingSum: string | null;
    }>();

    const ratingAverage = stats?.ratingAverage ? Number(stats.ratingAverage) : null;
    const ratingCount = stats?.ratingCount ? Number(stats.ratingCount) : 0;
    const ratingSum = stats?.ratingSum ? Number(stats.ratingSum) : 0;

    return { items, total, ratingAverage, ratingCount, ratingSum };
  }

  async findPlayerRecommendationsGiven(userProfileId: string, query: RecommendationListQuery): Promise<RecommendationListResult> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const base = this.recommendationsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.targetProfile', 'targetProfile')
      .leftJoinAndSelect('r.targetTeam', 'targetTeam')
      .leftJoinAndSelect('r.authorProfile', 'authorProfile')
      .leftJoinAndSelect('r.authorTeam', 'authorTeam')
      .where('r.authorType = :authorType', { authorType: 'player' })
      .andWhere('authorProfile.id = :userProfileId', { userProfileId });

    const [items, total] = await base
      .orderBy('r.createdAt', 'DESC')
      .addOrderBy('r.id', 'DESC')
      .skip(skip)
      .take(perPage)
      .getManyAndCount();

    const statsQuery = this.recommendationsRepo
      .createQueryBuilder('r')
      .leftJoin('r.authorProfile', 'authorProfile')
      .select('AVG(r.rating)', 'ratingAverage')
      .addSelect('COUNT(r.rating)', 'ratingCount')
      .addSelect('COALESCE(SUM(r.rating), 0)', 'ratingSum')
      .where('r.authorType = :authorType', { authorType: 'player' })
      .andWhere('authorProfile.id = :userProfileId', { userProfileId })
      .andWhere('r.rating IS NOT NULL');

    const stats = await statsQuery.getRawOne<{
      ratingAverage: string | null;
      ratingCount: string | null;
      ratingSum: string | null;
    }>();

    const ratingAverage = stats?.ratingAverage ? Number(stats.ratingAverage) : null;
    const ratingCount = stats?.ratingCount ? Number(stats.ratingCount) : 0;
    const ratingSum = stats?.ratingSum ? Number(stats.ratingSum) : 0;

    return { items, total, ratingAverage, ratingCount, ratingSum };
  }


  /**********************************
   * Module : profile badges
   * 
   ***********************************/
  async findPlayerBadgeContextBySlug(userSlug: string): Promise<any | null> {
    const slug = userSlug.trim();
    
    const row = await this.repo
      .createQueryBuilder('p')
      // .innerJoin(UserCredentialsEntity, 'c', 'c.id = p.userCredentialId')
      .select('p.id', 'userProfileId')
      .addSelect('p.createdAt', 'profileCreatedAt')
      // .addSelect('c.isEmailVerified', 'isEmailVerified')
      .where('LOWER(p.slug) = LOWER(:slug)', { slug })
      .getRawOne<{
        userProfileId: string;
        profileCreatedAt: Date;
        // isEmailVerified: 0 | 1 | boolean;
      }>();

    if (!row) return null;

    return {
      userProfileId: row.userProfileId,
      profileCreatedAt: new Date(row.profileCreatedAt),
      // isEmailVerified: Boolean(row.isEmailVerified),
    };
  }

  async findAssignedBadgeIds(userProfileId: string): Promise<number[]> {
    const rows = await this.badgesRepo.find({
      where: { userProfile: { id: userProfileId } },
      select: ['rscBadgeId'],
    });
    return rows.map((r) => r.rscBadgeId);
  }

  async findPlayerGameIdByProfileAndGame(userProfileId: string, gameId: number): Promise<number | null> {
    const entity = await this.playerGamesRepo.findOne({
      where: { profile: { id: userProfileId }, rscGame: { id: gameId } },
      select: ['id'],
    });

    return entity ? entity.id : null;
  }

  async createPlayerGame(userProfileId: string, input: PlayerGameCreateInput): Promise<UserGameEntity> {
    const created = await this.dataSource.transaction(async (manager) => {
      const gameRepo = manager.getRepository(UserGameEntity);
      const modeRepo = manager.getRepository(RscGameModeEntity);
      const rankRepo = manager.getRepository(RscGameRankEntity);
      const positionRepo = manager.getRepository(UserGamePositionEntity);
      const platformRepo = manager.getRepository(UserGamePlatformEntity);
      const characterRepo = manager.getRepository(UserGameCharacterEntity);
      const modeRankRepo = manager.getRepository(UserGameModeRankEntity);
      const lolRepo = manager.getRepository(UserGameLeagueOfLegendsEntity);
      const rocketRepo = manager.getRepository(UserGameRocketLeagueEntity);
      const valorantRepo = manager.getRepository(UserGameValorantEntity);
      const brawlRepo = manager.getRepository(UserGameBrawlStarsEntity);
      const fortniteRepo = manager.getRepository(UserGameFortniteEntity);

      const modeRanks = input.modeRanks ?? [];
      const modeIds = [...new Set(modeRanks.map((item) => item.modeId))];
      const rankIds = [...new Set(modeRanks.map((item) => item.rankId))];

      const modeRows = modeIds.length
        ? await modeRepo.find({
            where: { gameId: input.gameId, rscModeId: In(modeIds) },
          })
        : [];

      const rankRows = rankIds.length
        ? await rankRepo.find({
            where: { gameId: input.gameId, rscRankId: In(rankIds) },
          })
        : [];

      const modeById = new Map(modeRows.map((row) => [row.rscModeId, row]));
      const rankById = new Map(rankRows.map((row) => [row.rscRankId, row]));

      const modeRankEntities = modeRanks.map((item) => {
        const mode = modeById.get(item.modeId);
        const rank = rankById.get(item.rankId);
        if (!mode || !rank) {
          throw new Error('Player game mode rank relation is missing');
        }
        return { mode, rank };
      });

      const entity = gameRepo.create({
        profile: { id: userProfileId },
        rscGame: { id: input.gameId },
        isRecruitable: input.isRecruitable,
        isFavoriteGame: input.isFavoriteGame,
        trackerUrl: input.trackerUrl ?? null,
      });

      const saved = await gameRepo.save(entity);

      if (input.positionIds?.length) {
        await positionRepo.save(
          input.positionIds.map((id) =>
            positionRepo.create({
              game: saved,
              position: { id },
            }),
          ),
        );
      }

      if (input.platformIds?.length) {
        await platformRepo.save(
          input.platformIds.map((id) =>
            platformRepo.create({
              game: saved,
              platform: { id },
            }),
          ),
        );
      }

      if (input.characterIds?.length) {
        await characterRepo.save(
          input.characterIds.map((id) =>
            characterRepo.create({
              game: saved,
              character: { id },
            }),
          ),
        );
      }

      if (modeRankEntities.length) {
        await modeRankRepo.save(
          modeRankEntities.map((relation) =>
            modeRankRepo.create({
              game: saved,
              mode: relation.mode,
              rank: relation.rank,
            }),
          ),
        );
      }

      if (input.account) {
        switch (input.account.type) {
          case 'league-of-legends':
            await lolRepo.save(
              lolRepo.create({
                game: saved,
                username: input.account.username,
                tagLine: input.account.tagLine,
                region: input.account.region ?? null,
                puuid: input.account.puuid ?? null,
              }),
            );
            break;
          case 'rocket-league':
            await rocketRepo.save(
              rocketRepo.create({
                game: saved,
                username: input.account.username,
              }),
            );
            break;
          case 'valorant':
            await valorantRepo.save(
              valorantRepo.create({
                game: saved,
                username: input.account.username,
                tagLine: input.account.tagLine,
              }),
            );
            break;
          case 'brawl-stars':
            await brawlRepo.save(
              brawlRepo.create({
                game: saved,
                username: input.account.username,
              }),
            );
            break;
          case 'fortnite':
            await fortniteRepo.save(
              fortniteRepo.create({
                game: saved,
                username: input.account.username,
              }),
            );
            break;
        }
      }

      const reloaded = await gameRepo.findOne({ where: { id: saved.id } });
      return reloaded ?? saved;
    });

    return created;
  }

  async findPlayerGames(userProfileId: string): Promise<UserGameEntity[]> {
    const games = await this.playerGamesRepo.find({
      where: { profile: { id: userProfileId } },
      order: { id: 'ASC' },
    });

    return games;
  }

  async findPlayerGameByProfileAndGame(userProfileId: string, gameId: number): Promise<UserGameEntity | null> {
    const game = await this.playerGamesRepo.findOne({
      where: { profile: { id: userProfileId }, rscGame: { id: gameId } },
    });

    return game ?? null;
  }

  async updatePlayerGame(userProfileId: string, gameId: number, input: PlayerGameUpdateInput): Promise<UserGameEntity> {
    const updated = await this.dataSource.transaction(async (manager) => {
      const gameRepo = manager.getRepository(UserGameEntity);
      const modeRepo = manager.getRepository(RscGameModeEntity);
      const rankRepo = manager.getRepository(RscGameRankEntity);
      const positionRepo = manager.getRepository(UserGamePositionEntity);
      const platformRepo = manager.getRepository(UserGamePlatformEntity);
      const characterRepo = manager.getRepository(UserGameCharacterEntity);
      const modeRankRepo = manager.getRepository(UserGameModeRankEntity);
      const lolRepo = manager.getRepository(UserGameLeagueOfLegendsEntity);
      const rocketRepo = manager.getRepository(UserGameRocketLeagueEntity);
      const valorantRepo = manager.getRepository(UserGameValorantEntity);
      const brawlRepo = manager.getRepository(UserGameBrawlStarsEntity);
      const fortniteRepo = manager.getRepository(UserGameFortniteEntity);

      const entity = await gameRepo.findOne({
        where: { profile: { id: userProfileId }, rscGame: { id: gameId } },
      });

      if (!entity) {
        throw new Error('Player game not found');
      }

      const updates: Partial<UserGameEntity> = { id: entity.id };
      if (input.isRecruitable !== undefined) updates.isRecruitable = input.isRecruitable;
      if (input.isFavoriteGame !== undefined) updates.isFavoriteGame = input.isFavoriteGame;
      if (input.trackerUrl !== undefined) updates.trackerUrl = input.trackerUrl ?? null;

      if (Object.keys(updates).length > 1) {
        await gameRepo.save(updates);
      }

      if (input.positionIds !== undefined) {
        await positionRepo.delete({ game: { id: entity.id } });
        const positionIds = input.positionIds ?? [];
        if (positionIds.length) {
          await positionRepo.save(
            positionIds.map((id) =>
              positionRepo.create({
                game: entity,
                position: { id },
              }),
            ),
          );
        }
      }

      if (input.platformIds !== undefined) {
        await platformRepo.delete({ game: { id: entity.id } });
        const platformIds = input.platformIds ?? [];
        if (platformIds.length) {
          await platformRepo.save(
            platformIds.map((id) =>
              platformRepo.create({
                game: entity,
                platform: { id },
              }),
            ),
          );
        }
      }

      if (input.characterIds !== undefined) {
        await characterRepo.delete({ game: { id: entity.id } });
        const characterIds = input.characterIds ?? [];
        if (characterIds.length) {
          await characterRepo.save(
            characterIds.map((id) =>
              characterRepo.create({
                game: entity,
                character: { id },
              }),
            ),
          );
        }
      }

      if (input.modeRanks !== undefined) {
        await modeRankRepo.delete({ game: { id: entity.id } });
        const modeRanks = input.modeRanks ?? [];
        if (modeRanks.length) {
          const modeIds = [...new Set(modeRanks.map((item) => item.modeId))];
          const rankIds = [...new Set(modeRanks.map((item) => item.rankId))];

          const modeRows = modeIds.length
            ? await modeRepo.find({
                where: { gameId, rscModeId: In(modeIds) },
              })
            : [];

          const rankRows = rankIds.length
            ? await rankRepo.find({
                where: { gameId, rscRankId: In(rankIds) },
              })
            : [];

          const modeById = new Map(modeRows.map((row) => [row.rscModeId, row]));
          const rankById = new Map(rankRows.map((row) => [row.rscRankId, row]));

          const modeRankEntities = modeRanks.map((item) => {
            const mode = modeById.get(item.modeId);
            const rank = rankById.get(item.rankId);
            if (!mode || !rank) {
              throw new Error('Player game mode rank relation is missing');
            }
            return { mode, rank };
          });

          await modeRankRepo.save(
            modeRankEntities.map((relation) =>
              modeRankRepo.create({
                game: entity,
                mode: relation.mode,
                rank: relation.rank,
              }),
            ),
          );
        }
      }

      if (input.account !== undefined) {
        await lolRepo.delete({ game: { id: entity.id } });
        await rocketRepo.delete({ game: { id: entity.id } });
        await valorantRepo.delete({ game: { id: entity.id } });
        await brawlRepo.delete({ game: { id: entity.id } });
        await fortniteRepo.delete({ game: { id: entity.id } });

        if (input.account) {
          switch (input.account.type) {
            case 'league-of-legends':
              await lolRepo.save(
                lolRepo.create({
                  game: entity,
                  username: input.account.username,
                  tagLine: input.account.tagLine,
                  region: input.account.region ?? null,
                  puuid: input.account.puuid ?? null,
                }),
              );
              break;
            case 'rocket-league':
              await rocketRepo.save(
                rocketRepo.create({
                  game: entity,
                  username: input.account.username,
                }),
              );
              break;
            case 'valorant':
              await valorantRepo.save(
                valorantRepo.create({
                  game: entity,
                  username: input.account.username,
                  tagLine: input.account.tagLine,
                }),
              );
              break;
            case 'brawl-stars':
              await brawlRepo.save(
                brawlRepo.create({
                  game: entity,
                  username: input.account.username,
                }),
              );
              break;
            case 'fortnite':
              await fortniteRepo.save(
                fortniteRepo.create({
                  game: entity,
                  username: input.account.username,
                }),
              );
              break;
          }
        }
      }

      const reloaded = await gameRepo.findOne({ where: { id: entity.id } });
      return reloaded ?? entity;
    });

    return updated;
  }

  async deletePlayerGame(userProfileId: string, gameId: number): Promise<void> {
    await this.playerGamesRepo.delete({
      profile: { id: userProfileId },
      rscGame: { id: gameId },
    });
  }

}
