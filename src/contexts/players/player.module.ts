import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCredentialsEntity } from '../auth/infra/persistence/entities/user-credentials.entity';
import { UserProfileEntity } from '../auth/infra/persistence/entities/user-profile.entity';
import { PlayerReportsController } from './api/player-reports.controller';
import { PlayerSocialsController } from './api/player-socials.controller';
import { GetPlayerBySlugUseCase } from './app/usecases/get-player-by-slug.usecase';
import { PlayerRepositoryTypeorm } from './infra/persistence/repositories/player.repository';
import { PLAYER_REPOSITORY } from './app/ports/player.repository.port';
import { AuthModule } from '../auth/auth.module';
import { GetPlayerSocialLinksUsecase } from './app/usecases/social-links/get-social-links.use.case';
import { UpdatePlayerSocialLinksUseCase } from './app/usecases/social-links/update-social-links.usecase';
import { SocialLinksNormalizer } from './infra/normalizers/social-links.normalizer';
import { UserSocialLinkEntity } from './infra/entities/profile/user-social-link.entity';
import { CreatePlayerReportUseCase } from './app/usecases/reports/create-player-report.usecase';
import { CreateProfileReportUseCase } from './app/usecases/reports/create-profile-report.usecase';
import { UserReportEntity } from './infra/entities/profile/user-report.entity';
import { ProfileReportEntity } from './infra/entities/profile/profile-report.entity';
import { SendPlayerReportEmailHandler } from './app/handlers/send-player-report-email.handler';
import { GetPlayerReportsUseCase } from './app/usecases/reports/get-player-reports.usecase';
import { UpdatePlayerReportStatusUseCase } from './app/usecases/reports/update-player-report-status.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCredentialsEntity,
      UserProfileEntity,
      UserSocialLinkEntity,
      UserReportEntity,
      ProfileReportEntity,
    ]),
    AuthModule,
  ],
  controllers: [
    PlayerReportsController,
    PlayerSocialsController,
  ],
  providers: [
    GetPlayerBySlugUseCase,

    GetPlayerSocialLinksUsecase,
    UpdatePlayerSocialLinksUseCase,
    SocialLinksNormalizer,

    CreateProfileReportUseCase,
    CreatePlayerReportUseCase,
    GetPlayerReportsUseCase,
    UpdatePlayerReportStatusUseCase,
    SendPlayerReportEmailHandler,

    { provide: PLAYER_REPOSITORY, useClass: PlayerRepositoryTypeorm },
  ],
  exports: [PLAYER_REPOSITORY, CreateProfileReportUseCase],
})
export class PlayerModule {}
