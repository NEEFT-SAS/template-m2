import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesController } from './api/resources.controller';
import { GetResourcesUseCase } from './app/usecases/get-resources.usecase';
import { RscCountryEntity } from './infra/persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from './infra/persistence/entities/rsc-languages.entity';
import { RscSocialPlatformEntity } from './infra/persistence/entities/rsc-socials-platforms.entity';
import { ResourcesStore } from './infra/cache/resources.store';
import { RscProfileBadgeEntity } from './infra/persistence/entities/rsc-profile-badges.entity';
import { RscCharacterEntity } from './infra/persistence/entities/games/base/rsc-characters.entity';
import { RscModeEntity } from './infra/persistence/entities/games/base/rsc-modes.entity';
import { RscPlatformEntity } from './infra/persistence/entities/games/base/rsc-platforms.entity';
import { RscPositionEntity } from './infra/persistence/entities/games/base/rsc-positions.entity';
import { RscRankEntity } from './infra/persistence/entities/games/base/rsc-ranks.entity';
import { RscSeasonEntity } from './infra/persistence/entities/games/base/rsc-seasons.entity';
import { RscGameEntity } from './infra/persistence/entities/games/rsc-games.entity';
import { RscGameCharacterEntity } from './infra/persistence/entities/games/relations/rsc-game-characters.entity';
import { RscGameModeEntity } from './infra/persistence/entities/games/relations/rsc-game-modes.entity';
import { RscGamePlatformEntity } from './infra/persistence/entities/games/relations/rsc-game-platforms.entity';
import { RscGamePositionEntity } from './infra/persistence/entities/games/relations/rsc-game-positions.entity';
import { RscGameRankEntity } from './infra/persistence/entities/games/relations/rsc-game-ranks.entity';
import { RscGameSeasonEntity } from './infra/persistence/entities/games/relations/rsc-game-seasons.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    RscSocialPlatformEntity,
    RscProfileBadgeEntity,
    RscCountryEntity,
    RscLanguageEntity,
    RscCharacterEntity,
    RscModeEntity,
    RscPlatformEntity,
    RscPositionEntity,
    RscRankEntity,
    RscSeasonEntity,
    RscGameEntity,
    RscGamePlatformEntity,
    RscGameModeEntity,
    RscGamePositionEntity,
    RscGameRankEntity,
    RscGameSeasonEntity,
    RscGameCharacterEntity,
  ])],
  controllers: [ResourcesController],
  providers: [GetResourcesUseCase, ResourcesStore],
  exports: [ResourcesStore, TypeOrmModule],
})
export class ResourcesModule {}
