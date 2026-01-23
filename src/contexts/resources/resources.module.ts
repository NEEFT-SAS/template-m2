import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './api/resources.controller';
import { GetResourcesUseCase } from './app/usecases/get-resources.usecase';
import { RscCountryEntity } from './infra/persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from './infra/persistence/entities/rsc-languages.entity';
import { RscSocialPlatformEntity } from './infra/persistence/entities/rsc-socials-platforms.entity';
import { ResourcesStore } from './infra/cache/resources.store';
import { RscProfileBadgeEntity } from './infra/persistence/entities/rsc-profile-badges.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    RscSocialPlatformEntity,
    RscProfileBadgeEntity,
    RscCountryEntity,
    RscLanguageEntity,
  ])],
  controllers: [ResourcesController],
  providers: [GetResourcesUseCase, ResourcesStore],
  exports: [ResourcesStore, TypeOrmModule],
})
export class ResourcesModule {}
