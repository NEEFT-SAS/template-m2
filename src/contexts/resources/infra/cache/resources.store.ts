import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RscSocialPlatformEntity } from '../persistence/entities/rsc-socials-platforms.entity';
import { ResourcesPresenter, RscCountryPresenter, RscLanguagePresenter, RscProfileBadgePresenter, RscSocialPlatformPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { RscProfileBadgeEntity } from '../persistence/entities/rsc-profile-badges.entity';
import { RscCountryEntity } from '../persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from '../persistence/entities/rsc-languages.entity';


@Injectable()
export class ResourcesStore implements OnModuleInit {
  private readonly logger = new Logger(ResourcesStore.name);

  private snapshot: ResourcesPresenter = {
    version: new Date().toISOString(),
    rscCountries: [],
    rscLanguages: [],
    rscSocialPlatforms: [],
    rscProfileBadges: [],
  };

  constructor(
    @InjectRepository(RscSocialPlatformEntity) private readonly socialRepo: Repository<RscSocialPlatformEntity>,
    @InjectRepository(RscProfileBadgeEntity) private readonly badgeRepo: Repository<RscProfileBadgeEntity>,
    @InjectRepository(RscCountryEntity) private readonly countryRepo: Repository<RscCountryEntity>,
    @InjectRepository(RscLanguageEntity) private readonly languageRepo: Repository<RscLanguageEntity>,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  getSnapshot(): ResourcesPresenter {
    return this.snapshot;
  }

  async reload(): Promise<void> {
    
    const socials = await this.socialRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });

    const badges = await this.badgeRepo.find({
      where: { isActive: true },
      order: { priority: 'ASC', label: 'ASC' },
    });

    const countries = await this.countryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const languages = await this.languageRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });

    this.snapshot = {
      version: new Date().toISOString(),
      rscSocialPlatforms: plainToInstance(RscSocialPlatformPresenter, socials, { excludeExtraneousValues: true }),
      rscProfileBadges: plainToInstance(RscProfileBadgePresenter, badges, { excludeExtraneousValues: true }),
      rscCountries: plainToInstance(RscCountryPresenter, countries, { excludeExtraneousValues: true }),
      rscLanguages: plainToInstance(RscLanguagePresenter, languages, { excludeExtraneousValues: true }),
    };

    console.log('ResourcesStore reloaded:', this.snapshot);
    this.logger.log(`Resources loaded: rscSocialPlatforms=${this.snapshot.rscSocialPlatforms.length}`);
  }
}
