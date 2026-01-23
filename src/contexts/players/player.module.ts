import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserCredentialsEntity } from "../auth/infra/persistence/entities/user-credentials.entity";
import { UserProfileEntity } from "../auth/infra/persistence/entities/user-profile.entity";
import { PlayerController } from "./api/player.controller";
import { GetPlayerBySlugUseCase } from "./app/usecases/get-player-by-slug.usecase";
import { UpdatePlayerProfileUseCase } from "./app/usecases/update-player-profile.usecase";
import { UpdatePlayerAvailabilitiesUseCase } from "./app/usecases/availabilities/update-availabilities.usecase";
import { AUTH_REPOSITORY } from "../auth/app/ports/auth.repository.port";
import { PlayerRepositoryTypeorm } from "./infra/persistence/repositories/player.repository";
import { PLAYER_REPOSITORY } from "./app/ports/player.repository.port";
import { TOKEN_SERVICE } from "../auth/app/ports/token.port";
import { AuthModule } from "../auth/auth.module";
import { GetPlayerSocialLinksUsecase } from "./app/usecases/social-links/get-social-links.use.case";
import { UpdatePlayerSocialLinksUseCase } from "./app/usecases/social-links/update-social-links.usecase";
import { ResourcesModule } from "../resources/resources.module";
import { SocialLinksNormalizer } from "./infra/normalizers/social-links.normalizer";
import { PlayerSocialLinkEntity } from "./infra/entities/player-social-link.entity";
import { UserProfileAvailabilityEntity } from "./infra/entities/user-profile-availability.entity";
import { PlayerBadgeEntity } from "./infra/entities/player-badge.entity";
import { GetPlayerBadgesUsecase } from "./app/usecases/badges/get-player-badges.usecase";
import { PlayerBadgesResolver } from "./app/services/player-badges.resolver";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCredentialsEntity,
      UserProfileEntity,
      PlayerSocialLinkEntity,
      PlayerBadgeEntity,
      UserProfileAvailabilityEntity
    ]),
    ResourcesModule,
    AuthModule
  ],
  controllers: [PlayerController],
  providers: [
    GetPlayerBySlugUseCase,
    UpdatePlayerProfileUseCase,
    UpdatePlayerAvailabilitiesUseCase,

    GetPlayerSocialLinksUsecase,
    UpdatePlayerSocialLinksUseCase,
    SocialLinksNormalizer,

    GetPlayerBadgesUsecase,
    PlayerBadgesResolver,

    { provide: PLAYER_REPOSITORY, useClass: PlayerRepositoryTypeorm },
  ],
  exports: [PLAYER_REPOSITORY],
})
export class PlayerModule {}
