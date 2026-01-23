import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerProfileContext, PlayerProfileUpdatePayload, PlayerRepositoryPort } from '@/contexts/players/app/ports/player.repository.port';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlayerSocialLinkEntity } from '../../entities/player-social-link.entity';
import { PlayerAvailabilityPresenter, PlayerPrivateProfilePresenter, PlayerProfilePresenter, PlayerSocialLinkPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { PlayerBadgeEntity } from '../../entities/player-badge.entity';
import { UserProfileAvailabilityEntity } from '../../entities/user-profile-availability.entity';


@Injectable()
export class PlayerRepositoryTypeorm implements PlayerRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity) private readonly repo: Repository<UserProfileEntity>,
    @InjectRepository(UserCredentialsEntity) private readonly credentialsRepo: Repository<UserCredentialsEntity>,
    @InjectRepository(PlayerSocialLinkEntity) private readonly linksRepo: Repository<PlayerSocialLinkEntity>,
    @InjectRepository(PlayerBadgeEntity) private readonly badgesRepo: Repository<PlayerBadgeEntity>,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}


  async findPublicProfileBySlug(slug: string): Promise<PlayerProfilePresenter | null> {
    const entity = await this.repo.findOne({
      where: { slug },
    });

    return plainToInstance(PlayerProfilePresenter, entity, { excludeExtraneousValues: true });
  }

  async findPrivateProfileBySlug(slug: string): Promise<PlayerPrivateProfilePresenter | null> {
    const entity = await this.repo.findOne({
      where: { slug },
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
        await manager.getRepository(UserProfileEntity).save({
          id: context.userProfileId,
          ...profileUpdates,
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
      where: { userProfileId },
      order: { createdAt: 'ASC' },
    });
  } 
  
  async replaceSocialLinks(userProfileId: string, links: PlayerSocialLinkPresenter[]): Promise<PlayerSocialLinkEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PlayerSocialLinkEntity);

      console.log(links);
      
      await repo.delete({ userProfileId });

      if (!links.length) return [];

      const entities = links.map((l) =>
        repo.create({
          userProfileId,
          rscSocialPlatformId: l.rscSocialPlatformId,
          username: l.username,
          url: l.url,
        }),
      );

      return repo.save(entities);
    });
  }

  async replaceAvailabilities(
    userProfileId: string,
    availabilities: PlayerAvailabilityPresenter[],
  ): Promise<PlayerAvailabilityPresenter[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserProfileAvailabilityEntity);

      await repo.delete({ userProfileId });

      if (!availabilities.length) return [];

      const entities = availabilities.map((availability) =>
        repo.create({
          userProfileId,
          weekday: availability.weekday,
          slot: availability.slot,
        }),
      );

      return repo.save(entities);
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
      where: { userProfileId },
      select: ['rscBadgeId'],
    });
    return rows.map((r) => r.rscBadgeId);
  }
  
}
