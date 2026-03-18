import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCredentialsEntity } from '../auth/infra/persistence/entities/user-credentials.entity';
import { UserProfileEntity } from '../auth/infra/persistence/entities/user-profile.entity';
import { PlayerProfileController } from './api/player-profile.controller';
import { PlayerGamesController } from './api/player-games.controller';
import { PlayerStaffRolesController } from './api/player-staff-roles.controller';
import { PlayerExperiencesController } from './api/player-experiences.controller';
import { PlayerReportsController } from './api/player-reports.controller';
import { PlayerSocialsController } from './api/player-socials.controller';
import { PlayerBadgesController } from './api/player-badges.controller';
import { GetPlayerBySlugUseCase } from './app/usecases/get-player-by-slug.usecase';
import { UpdatePlayerProfileUseCase } from './app/usecases/update-player-profile.usecase';
import { UpdatePlayerAvailabilitiesUseCase } from './app/usecases/availabilities/update-availabilities.usecase';
import { GetPlayerAvailabilitiesUseCase } from './app/usecases/availabilities/get-availabilities.usecase';
import { AddPlayerExperienceUseCase } from './app/usecases/experiences/add-experience.usecase';
import { GetPlayerExperiencesUseCase } from './app/usecases/experiences/get-experiences.usecase';
import { GetPlayerExperienceUseCase } from './app/usecases/experiences/get-experience.usecase';
import { UpdatePlayerExperienceUseCase } from './app/usecases/experiences/update-experience.usecase';
import { DeletePlayerExperienceUseCase } from './app/usecases/experiences/delete-experience.usecase';
import { AddPlayerEducationExperienceUseCase } from './app/usecases/experiences/add-education-experience.usecase';
import { GetPlayerEducationExperiencesUseCase } from './app/usecases/experiences/get-education-experiences.usecase';
import { GetPlayerEducationExperienceUseCase } from './app/usecases/experiences/get-education-experience.usecase';
import { UpdatePlayerEducationExperienceUseCase } from './app/usecases/experiences/update-education-experience.usecase';
import { DeletePlayerEducationExperienceUseCase } from './app/usecases/experiences/delete-education-experience.usecase';
import { AddPlayerProfessionalExperienceUseCase } from './app/usecases/experiences/add-professional-experience.usecase';
import { GetPlayerProfessionalExperiencesUseCase } from './app/usecases/experiences/get-professional-experiences.usecase';
import { GetPlayerProfessionalExperienceUseCase } from './app/usecases/experiences/get-professional-experience.usecase';
import { UpdatePlayerProfessionalExperienceUseCase } from './app/usecases/experiences/update-professional-experience.usecase';
import { DeletePlayerProfessionalExperienceUseCase } from './app/usecases/experiences/delete-professional-experience.usecase';
import { PlayerRepositoryTypeorm } from './infra/persistence/repositories/player.repository';
import { PLAYER_REPOSITORY } from './app/ports/player.repository.port';
import { AuthModule } from '../auth/auth.module';
import { GetPlayerSocialLinksUsecase } from './app/usecases/social-links/get-social-links.use.case';
import { UpdatePlayerSocialLinksUseCase } from './app/usecases/social-links/update-social-links.usecase';
import { ResourcesModule } from '../resources/resources.module';
import { SocialLinksNormalizer } from './infra/normalizers/social-links.normalizer';
import { UserSocialLinkEntity } from './infra/entities/profile/user-social-link.entity';
import { UserProfileAvailabilityEntity } from './infra/entities/profile/user-profile-availability.entity';
import { UserProfileSchoolExperienceEntity } from './infra/entities/profile/user-profile-school-experience.entity';
import { UserProfileExperienceEntity } from './infra/entities/profile/user-profile-experience.entity';
import { UserProfileProfessionalExperienceEntity } from './infra/entities/profile/user-profile-professional-experience.entity';
import { UserBadgeEntity } from './infra/entities/profile/user-badge.entity';
import { GetPlayerBadgesUsecase } from './app/usecases/badges/get-player-badges.usecase';
import { PlayerBadgesResolver } from './app/services/player-badges.resolver';
import { CreatePlayerReportUseCase } from './app/usecases/reports/create-player-report.usecase';
import { CreateProfileReportUseCase } from './app/usecases/reports/create-profile-report.usecase';
import { UserReportEntity } from './infra/entities/profile/user-report.entity';
import { ProfileReportEntity } from './infra/entities/profile/profile-report.entity';
import { SendPlayerReportEmailHandler } from './app/handlers/send-player-report-email.handler';
import { SendPlayerRecommendationReceivedEmailHandler } from './app/handlers/send-player-recommendation-received-email.handler';
import { GetPlayerReportsUseCase } from './app/usecases/reports/get-player-reports.usecase';
import { UpdatePlayerReportStatusUseCase } from './app/usecases/reports/update-player-report-status.usecase';
import { UserGameEntity } from './infra/entities/game/user-game.entity';
import { UserGameCharacterEntity } from './infra/entities/game/user-game-character.entity';
import { UserGamePlatformEntity } from './infra/entities/game/user-game-platform.entity';
import { UserGamePositionEntity } from './infra/entities/game/user-game-position.entity';
import { UserGameModeRankEntity } from './infra/entities/game/user-game-mode-rank.entity';
import { UserGameLeagueOfLegendsEntity } from './infra/entities/game/user-game-league-of-legends.entity';
import { UserGameRocketLeagueEntity } from './infra/entities/game/user-game-rocket-league.entity';
import { UserGameValorantEntity } from './infra/entities/game/user-game-valorant.entity';
import { UserGameBrawlStarsEntity } from './infra/entities/game/user-game-brawl-stars.entity';
import { UserGameFortniteEntity } from './infra/entities/game/user-game-fortnite.entity';
import { UserProfileStaffRoleEntity } from './infra/entities/profile/user-profile-staff-role.entity';
import { RecommendationEntity } from './infra/entities/recommendations/recommendation.entity';
import { RecommendationHelpfulVoteEntity } from './infra/entities/recommendations/recommendation-helpful-vote.entity';
import { RecommendationRequestEntity } from './infra/entities/recommendations/recommendation-request.entity';
import { CreatePlayerGameUseCase } from './app/usecases/games/create-player-game.usecase';
import { DeletePlayerGameUseCase } from './app/usecases/games/delete-player-game.usecase';
import { GetPlayerGamesUseCase } from './app/usecases/games/get-player-games.usecase';
import { GetPlayerGameUseCase } from './app/usecases/games/get-player-game.usecase';
import { UpdatePlayerGameUseCase } from './app/usecases/games/update-player-game.usecase';
import { CreatePlayerStaffRoleUseCase } from './app/usecases/staff-roles/create-player-staff-role.usecase';
import { DeletePlayerStaffRoleUseCase } from './app/usecases/staff-roles/delete-player-staff-role.usecase';
import { GetPlayerStaffRoleUseCase } from './app/usecases/staff-roles/get-player-staff-role.usecase';
import { GetPlayerStaffRolesUseCase } from './app/usecases/staff-roles/get-player-staff-roles.usecase';
import { UpdatePlayerStaffRoleUseCase } from './app/usecases/staff-roles/update-player-staff-role.usecase';
import { CreateRecommendationUseCase } from './app/usecases/recommendations/create-recommendation.usecase';
import { DeleteRecommendationUseCase } from './app/usecases/recommendations/delete-recommendation.usecase';
import { ListPlayerReceivedRecommendationsUseCase } from './app/usecases/recommendations/list-player-received-recommendations.usecase';
import { ListPlayerGivenRecommendationsUseCase } from './app/usecases/recommendations/list-player-given-recommendations.usecase';
import { TeamsModule } from '../teams/teams.module';
import { PlayerRecommendationsController } from './api/player-recommendations.controller';
import { PlayerProfileScoreService } from './app/services/player-profile-score.service';
import { PlayerScoreService } from '../search/app/services/player-score.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCredentialsEntity,
      UserProfileEntity,
      UserSocialLinkEntity,
      UserBadgeEntity,
      UserProfileAvailabilityEntity,
      UserProfileSchoolExperienceEntity,
      UserProfileProfessionalExperienceEntity,
      UserProfileExperienceEntity,
      UserReportEntity,
      ProfileReportEntity,
      UserGameEntity,
      UserGameCharacterEntity,
      UserGamePlatformEntity,
      UserGamePositionEntity,
      UserGameModeRankEntity,
      UserGameLeagueOfLegendsEntity,
      UserGameRocketLeagueEntity,
      UserGameValorantEntity,
      UserGameBrawlStarsEntity,
      UserGameFortniteEntity,
      UserProfileStaffRoleEntity,
      RecommendationEntity,
      RecommendationHelpfulVoteEntity,
      RecommendationRequestEntity,
    ]),
    ResourcesModule,
    AuthModule,
    forwardRef(() => TeamsModule),
  ],
  controllers: [
    PlayerProfileController,
    PlayerGamesController,
    PlayerStaffRolesController,
    PlayerExperiencesController,
    PlayerReportsController,
    PlayerSocialsController,
    PlayerBadgesController,
    PlayerRecommendationsController,
  ],
  providers: [
    GetPlayerBySlugUseCase,
    GetPlayerAvailabilitiesUseCase,
    UpdatePlayerProfileUseCase,
    UpdatePlayerAvailabilitiesUseCase,

    AddPlayerExperienceUseCase,
    GetPlayerExperiencesUseCase,
    GetPlayerExperienceUseCase,
    UpdatePlayerExperienceUseCase,
    DeletePlayerExperienceUseCase,

    AddPlayerEducationExperienceUseCase,
    GetPlayerEducationExperiencesUseCase,
    GetPlayerEducationExperienceUseCase,
    UpdatePlayerEducationExperienceUseCase,
    DeletePlayerEducationExperienceUseCase,

    AddPlayerProfessionalExperienceUseCase,
    GetPlayerProfessionalExperiencesUseCase,
    GetPlayerProfessionalExperienceUseCase,
    UpdatePlayerProfessionalExperienceUseCase,
    DeletePlayerProfessionalExperienceUseCase,

    GetPlayerSocialLinksUsecase,
    UpdatePlayerSocialLinksUseCase,
    SocialLinksNormalizer,

    GetPlayerBadgesUsecase,
    PlayerBadgesResolver,

    CreateProfileReportUseCase,
    CreatePlayerReportUseCase,
    GetPlayerReportsUseCase,
    UpdatePlayerReportStatusUseCase,
    SendPlayerReportEmailHandler,
    SendPlayerRecommendationReceivedEmailHandler,
    CreatePlayerGameUseCase,
    DeletePlayerGameUseCase,
    GetPlayerGamesUseCase,
    GetPlayerGameUseCase,
    UpdatePlayerGameUseCase,
    CreatePlayerStaffRoleUseCase,
    DeletePlayerStaffRoleUseCase,
    GetPlayerStaffRolesUseCase,
    GetPlayerStaffRoleUseCase,
    UpdatePlayerStaffRoleUseCase,
    CreateRecommendationUseCase,
    DeleteRecommendationUseCase,
    ListPlayerReceivedRecommendationsUseCase,
    ListPlayerGivenRecommendationsUseCase,
    PlayerScoreService,
    PlayerProfileScoreService,

    { provide: PLAYER_REPOSITORY, useClass: PlayerRepositoryTypeorm },
  ],
  exports: [PLAYER_REPOSITORY, CreateProfileReportUseCase],
})
export class PlayerModule {}
