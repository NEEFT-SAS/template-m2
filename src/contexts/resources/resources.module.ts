import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './api/resources.controller';
import { GetResourcesUseCase } from './app/usecases/get-resources.usecase';
import { RscSocialPlatformEntity } from './infra/persistence/entities/rsc-socials-platforms.entity';
import { ResourcesStore } from './infra/cache/resources.store';


@Module({
  imports: [TypeOrmModule.forFeature([RscSocialPlatformEntity])],
  controllers: [ResourcesController],
  providers: [GetResourcesUseCase, ResourcesStore],
  exports: [ResourcesStore, TypeOrmModule],
})
export class ResourcesModule {}