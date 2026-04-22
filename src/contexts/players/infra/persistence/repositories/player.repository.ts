import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerGameCreateInput, PlayerGameUpdateInput, PlayerProfileContext, PlayerProfileUpdatePayload, PlayerRepositoryPort, PlayerStaffRoleCreateInput, PlayerStaffRoleUpdateInput, RecommendationCreateInput, RecommendationListQuery, RecommendationListResult } from '@/contexts/players/app/ports/player.repository.port';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UserSocialLinkEntity } from '../../entities/profile/user-social-link.entity';
import { PlayerAvailabilityPresenter, PlayerReportStatus, PlayerSocialLinkPresenter } from '@neeft-sas/shared';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { PlayerEducationExperienceInput, PlayerEducationExperienceUpdateInput, PlayerExperienceInput, PlayerExperienceUpdateInput, PlayerProfessionalExperienceInput, PlayerProfessionalExperienceUpdateInput, PlayerReportCreateInput } from '@/contexts/players/app/ports/player.repository.port';
import { UserReportEntity } from '../../entities/profile/user-report.entity';


@Injectable()
export class PlayerRepositoryTypeorm implements PlayerRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity) private readonly repo: Repository<UserProfileEntity>,
    @InjectRepository(UserCredentialsEntity) private readonly credentialsRepo: Repository<UserCredentialsEntity>,
    @InjectRepository(UserSocialLinkEntity) private readonly linksRepo: Repository<UserSocialLinkEntity>,
    @InjectRepository(UserReportEntity) private readonly reportsRepo: Repository<UserReportEntity>,
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
    return entity ? entity.id : null;
  }

  async findProfileContextBySlug(slug: string): Promise<PlayerProfileContext | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      select: ['id', 'userCredentialId'],
    });

    return entity ? { userProfileId: entity.id, userCredentialId: entity.userCredentialId } : null;
  }

  async findProfileById(profileId: string): Promise<UserProfileEntity | null> {
    const entity = await this.repo.findOne({
      where: { id: profileId },
      relations: { nationality: true, languages: true,  },
    });

    return entity ?? null;
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

  async findAvailabilities(userProfileId: string): Promise<UserProfileAvailabilityEntity[]> {
    return this.dataSource.getRepository(UserProfileAvailabilityEntity).find({
      where: { userProfile: { id: userProfileId } },
      order: { weekday: 'ASC', slot: 'ASC' },
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
}
