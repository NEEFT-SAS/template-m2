import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerProfileContext, PlayerProfileUpdatePayload, PlayerRepositoryPort } from '@/contexts/players/app/ports/player.repository.port';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlayerSocialLinkEntity } from '../../entities/player-social-link.entity';
import { PlayerAvailabilityPresenter, PlayerEducationExperiencePresenter, PlayerExperiencePresenter, PlayerPrivateProfilePresenter, PlayerProfessionalExperiencePresenter, PlayerProfilePresenter, PlayerSocialLinkPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { PlayerBadgeEntity } from '../../entities/player-badge.entity';
import { UserProfileAvailabilityEntity } from '../../entities/user-profile-availability.entity';
import { UserProfileEducationEntity } from '../../entities/user-profile-education.entity';
import { UserProfileExperienceEntity } from '../../entities/user-profile-experience.entity';
import { UserProfileProfessionalExperienceEntity } from '../../entities/user-profile-professional-experience.entity';
import { PlayerEducationExperienceInput, PlayerEducationExperienceUpdateInput, PlayerExperienceInput, PlayerExperienceUpdateInput, PlayerProfessionalExperienceInput, PlayerProfessionalExperienceUpdateInput } from '@/contexts/players/app/ports/player.repository.port';


@Injectable()
export class PlayerRepositoryTypeorm implements PlayerRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity) private readonly repo: Repository<UserProfileEntity>,
    @InjectRepository(UserCredentialsEntity) private readonly credentialsRepo: Repository<UserCredentialsEntity>,
    @InjectRepository(PlayerSocialLinkEntity) private readonly linksRepo: Repository<PlayerSocialLinkEntity>,
    @InjectRepository(UserProfileExperienceEntity) private readonly experiencesRepo: Repository<UserProfileExperienceEntity>,
    @InjectRepository(UserProfileEducationEntity) private readonly educationsRepo: Repository<UserProfileEducationEntity>,
    @InjectRepository(UserProfileProfessionalExperienceEntity) private readonly professionalExperiencesRepo: Repository<UserProfileProfessionalExperienceEntity>,
    @InjectRepository(PlayerBadgeEntity) private readonly badgesRepo: Repository<PlayerBadgeEntity>,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async findPublicProfileBySlug(slug: string): Promise<PlayerProfilePresenter | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      relations: { nationality: true, languages: true },
    });

    return entity ? plainToInstance(PlayerProfilePresenter, entity, { excludeExtraneousValues: true }) : null;
  }

  async findPrivateProfileBySlug(slug: string): Promise<PlayerPrivateProfilePresenter | null> {
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

    return plainToInstance(
      PlayerPrivateProfilePresenter,
      { ...entity, email: credentials.email },
      { excludeExtraneousValues: true },
    );
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
  
  async replaceSocialLinks(userProfileId: string, links: PlayerSocialLinkPresenter[]): Promise<PlayerSocialLinkEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PlayerSocialLinkEntity);

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

  async replaceAvailabilities(userProfileId: string, availabilities: PlayerAvailabilityPresenter[]): Promise<PlayerAvailabilityPresenter[]> {
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
  async addExperience(userProfileId: string, input: PlayerExperienceInput): Promise<PlayerExperiencePresenter> {
    const entity = this.experiencesRepo.create({
      userProfile: { id: userProfileId },
      teamName: input.teamName ?? null,
      jobTitle: input.jobTitle,
      description: input.description ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
    });

    const saved = await this.experiencesRepo.save(entity);
    return plainToInstance(PlayerExperiencePresenter, saved, { excludeExtraneousValues: true });
  }

  async findExperiences(userProfileId: string): Promise<PlayerExperiencePresenter[]> {
    return this.experiencesRepo.find({
      where: { userProfile: { id: userProfileId } },
      order: { startDate: 'DESC', endDate: 'DESC', id: 'DESC' },
    });
  }

  async findExperienceById(userProfileId: string, experienceId: number): Promise<PlayerExperiencePresenter | null> {
    return this.experiencesRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });
  }

  async updateExperience(userProfileId: string, experienceId: number, input: PlayerExperienceUpdateInput): Promise<PlayerExperiencePresenter> {
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
  async addEducationExperience(userProfileId: string, input: PlayerEducationExperienceInput): Promise<PlayerEducationExperiencePresenter> {
    const entity = this.educationsRepo.create({
      userProfile: { id: userProfileId },
      title: input.title,
      school: input.school,
      location: input.location ?? null,
      fieldOfStudy: input.fieldOfStudy ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      ongoing: input.ongoing ?? false,
      description: input.description ?? null,
    });

    const saved = await this.educationsRepo.save(entity);
    return plainToInstance(PlayerEducationExperiencePresenter, saved, { excludeExtraneousValues: true });
  }

  async findEducationExperiences(userProfileId: string): Promise<PlayerEducationExperiencePresenter[]> {
    return this.educationsRepo.find({
      where: { userProfile: { id: userProfileId } },
      order: { startDate: 'DESC', endDate: 'DESC', id: 'DESC' },
    });
  }

  async findEducationExperienceById(userProfileId: string, experienceId: number): Promise<PlayerEducationExperiencePresenter | null> {
    return this.educationsRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });
  }

  async updateEducationExperience(userProfileId: string, experienceId: number, input: PlayerEducationExperienceUpdateInput): Promise<PlayerEducationExperiencePresenter> {
    await this.educationsRepo.save({
      id: experienceId,
      userProfile: { id: userProfileId },
      ...input,
    });

    const updated = await this.educationsRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });

    if (!updated) {
      throw new Error('Education experience not found');
    }

    return updated;
  }

  async deleteEducationExperience(userProfileId: string, experienceId: number): Promise<void> {
    await this.educationsRepo.delete({
      id: experienceId,
      userProfile: { id: userProfileId },
    });
  }

  /**********************************
   * Module : Professional Experiences
   * 
   ***********************************/
  async addProfessionalExperience(userProfileId: string, input: PlayerProfessionalExperienceInput): Promise<PlayerProfessionalExperiencePresenter> {
    const entity = this.professionalExperiencesRepo.create({
      userProfile: { id: userProfileId },
      title: input.title,
      company: input.company,
      location: input.location ?? null,
      contractType: input.contractType ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      ongoing: input.ongoing ?? false,
      description: input.description ?? null,
    });

    const saved = await this.professionalExperiencesRepo.save(entity);
    return plainToInstance(PlayerProfessionalExperiencePresenter, saved, { excludeExtraneousValues: true });
  }

  async findProfessionalExperiences(userProfileId: string): Promise<PlayerProfessionalExperiencePresenter[]> {
    return this.professionalExperiencesRepo.find({
      where: { userProfile: { id: userProfileId } },
      order: { startDate: 'DESC', endDate: 'DESC', id: 'DESC' },
    });
  }

  async findProfessionalExperienceById(userProfileId: string, experienceId: number): Promise<PlayerProfessionalExperiencePresenter | null> {
    return this.professionalExperiencesRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });
  }

  async updateProfessionalExperience(userProfileId: string, experienceId: number, input: PlayerProfessionalExperienceUpdateInput): Promise<PlayerProfessionalExperiencePresenter> {
    await this.professionalExperiencesRepo.save({
      id: experienceId,
      userProfile: { id: userProfileId },
      ...input,
    });

    const updated = await this.professionalExperiencesRepo.findOne({
      where: { id: experienceId, userProfile: { id: userProfileId } },
    });

    if (!updated) {
      throw new Error('Professional experience not found');
    }

    return updated;
  }

  async deleteProfessionalExperience(userProfileId: string, experienceId: number): Promise<void> {
    await this.professionalExperiencesRepo.delete({
      id: experienceId,
      userProfile: { id: userProfileId },
    });
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
  
}
