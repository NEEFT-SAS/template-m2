import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserProfileEntity } from "../auth/infra/persistence/entities/user-profile.entity";
import { PlayerController } from "./api/player.controller";
import { GetPlayerBySlugUseCase } from "./app/usecases/get-player-by-slug.usecase";
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfileEntity,
      PlayerSocialLinkEntity,
    ]),
    ResourcesModule,
    AuthModule
  ],
  controllers: [PlayerController],
  providers: [
    GetPlayerBySlugUseCase,

    GetPlayerSocialLinksUsecase,
    UpdatePlayerSocialLinksUseCase,
    SocialLinksNormalizer,

    { provide: PLAYER_REPOSITORY, useClass: PlayerRepositoryTypeorm },
  ],
  exports: [PLAYER_REPOSITORY],
})
export class PlayerModule {}
