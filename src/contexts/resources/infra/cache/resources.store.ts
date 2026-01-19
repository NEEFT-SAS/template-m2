import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RscSocialPlatformEntity } from '../persistence/entities/rsc-socials-platforms.entity';
import { ResourcesPresenter, RscSocialPlatformPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';


@Injectable()
export class ResourcesStore implements OnModuleInit {
  private readonly logger = new Logger(ResourcesStore.name);

  private snapshot: ResourcesPresenter = {
    version: new Date().toISOString(),
    rscSocialPlatforms: [],
  };

  constructor(
    @InjectRepository(RscSocialPlatformEntity)
    private readonly socialRepo: Repository<RscSocialPlatformEntity>,
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

    this.snapshot = {
      version: new Date().toISOString(),
      rscSocialPlatforms: plainToInstance(RscSocialPlatformPresenter, socials, { excludeExtraneousValues: true }),
    };

    this.logger.log(`Resources loaded: rscSocialPlatforms=${this.snapshot.rscSocialPlatforms.length}`);
  }
}
