import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ResourcesModule } from '../resources/resources.module';
import { UserProfileEntity } from '../auth/infra/persistence/entities/user-profile.entity';
import { TeamController } from './api/team.controller';
import { CreateTeamUseCase } from './app/usecases/profile/create-team.usecase';
import { UpdateTeamUseCase } from './app/usecases/profile/update-team.usecase';
import { DeleteTeamUseCase } from './app/usecases/profile/delete-team.usecase';
import { TEAM_REPOSITORY } from './app/ports/team.repository.port';
import { TeamRepositoryTypeorm } from './infra/persistence/repositories/team.repository';
import { TeamEntity } from './infra/entities/team.entity';
import { TeamOwnerOrAdminGuard } from './infra/guards/team-owner-or-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeamEntity, UserProfileEntity]),
    ResourcesModule,
    AuthModule,
  ],
  controllers: [TeamController],
  providers: [
    CreateTeamUseCase,
    UpdateTeamUseCase,
    DeleteTeamUseCase,
    TeamOwnerOrAdminGuard,
    { provide: TEAM_REPOSITORY, useClass: TeamRepositoryTypeorm },
  ],
  exports: [TEAM_REPOSITORY],
})
export class TeamsModule {}
