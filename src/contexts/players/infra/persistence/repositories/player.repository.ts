import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerPublicRecord, PlayerRepositoryPort } from '@/contexts/players/app/ports/player.repository.port';
import { RscSocialPlatformEntity } from '@/contexts/resources/infra/persistence/entities/rsc-socials-platforms.entity';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PlayerSocialLinkEntity } from '../../entities/player-social-link.entity';
import { PlayerSocialLinkPresenter, PlayerSocialLinkToUpdateDTO } from '@neeft-sas/shared';


@Injectable()
export class PlayerRepositoryTypeorm implements PlayerRepositoryPort {
  constructor(
    @InjectRepository(UserProfileEntity) private readonly repo: Repository<UserProfileEntity>,
    @InjectRepository(PlayerSocialLinkEntity) private readonly linksRepo: Repository<PlayerSocialLinkEntity>,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}


  async findPublicProfileBySlug(slug: string): Promise<any | null> {
    const entity = await this.repo.findOne({
      where: { slug },
    });

    return entity ?? null;
  }
  
  async findProfileIdBySlug(slug: string): Promise<string | null> {
    const entity = await this.repo.findOne({
      where: { slug },
      select: ['id'],
    });

    console.log(slug, entity);
    
    return entity ? entity.id : null;
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
}