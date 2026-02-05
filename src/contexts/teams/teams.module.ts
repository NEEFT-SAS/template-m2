import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ResourcesModule } from '../resources/resources.module';
import { PlayerModule } from '../players/player.module';
import { UserProfileEntity } from '../auth/infra/persistence/entities/user-profile.entity';
import { TeamController } from './api/team.controller';
import { CreateTeamUseCase } from './app/usecases/profile/create-team.usecase';
import { UpdateTeamUseCase } from './app/usecases/profile/update-team.usecase';
import { DeleteTeamUseCase } from './app/usecases/profile/delete-team.usecase';
import { CreateTeamMemberUseCase } from './app/usecases/members/create-team-member.usecase';
import { CreateTeamRosterUseCase } from './app/usecases/rosters/create-team-roster.usecase';
import { AddTeamRosterMemberUseCase } from './app/usecases/rosters/add-team-roster-member.usecase';
import { TEAM_REPOSITORY } from './app/ports/team.repository.port';
import { TeamRepositoryTypeorm } from './infra/persistence/repositories/team.repository';
import { TeamEntity } from './infra/entities/team.entity';
import { TeamOwnerOrAdminGuard } from './infra/guards/team-owner-or-admin.guard';
import { TeamMemberEntity } from './infra/entities/team-member.entity';
import { TeamRosterEntity } from './infra/entities/team-roster.entity';
import { TeamRosterMemberEntity } from './infra/entities/team-roster-member.entity';
import { TeamRecommendationsController } from './api/team-recommendations.controller';
import { CreateRecommendationUseCase } from '@/contexts/players/app/usecases/recommendations/create-recommendation.usecase';
import { DeleteRecommendationUseCase } from '@/contexts/players/app/usecases/recommendations/delete-recommendation.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamEntity,
      TeamMemberEntity,
      TeamRosterEntity,
      TeamRosterMemberEntity,
      UserProfileEntity,
    ]),
    ResourcesModule,
    AuthModule,
    forwardRef(() => PlayerModule),
  ],
  controllers: [TeamController, TeamRecommendationsController],
  providers: [
    CreateTeamUseCase,
    UpdateTeamUseCase,
    DeleteTeamUseCase,
    CreateTeamMemberUseCase,
    CreateTeamRosterUseCase,
    AddTeamRosterMemberUseCase,
    TeamOwnerOrAdminGuard,
    CreateRecommendationUseCase,
    DeleteRecommendationUseCase,
    { provide: TEAM_REPOSITORY, useClass: TeamRepositoryTypeorm },
  ],
  exports: [TEAM_REPOSITORY],
})
export class TeamsModule {}
