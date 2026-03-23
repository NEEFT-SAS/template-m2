import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/contexts/auth/auth.module';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { FollowEntity } from './infra/entities/follow.entity';
import { FOLLOW_REPOSITORY } from './app/ports/follow.repository.port';
import { FOLLOW_SUBJECTS_REPOSITORY } from './app/ports/follow-subjects.repository.port';
import { FollowEntityUseCase } from './app/usecases/follow-entity.usecase';
import { UnfollowEntityUseCase } from './app/usecases/unfollow-entity.usecase';
import { GetFollowStatusUseCase } from './app/usecases/get-follow-status.usecase';
import { PlayerFollowController } from './api/controllers/player-follow.controller';
import { TeamFollowController } from './api/controllers/team-follow.controller';
import { FollowRepositoryTypeorm } from './infra/persistence/follow.repository';
import { FollowSubjectsRepositoryTypeorm } from './infra/persistence/follow-subjects.repository';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FollowEntity,
      UserProfileEntity,
      TeamEntity,
      TeamMemberEntity,
    ]),
    AuthModule,
    TeamsModule,
  ],
  controllers: [PlayerFollowController, TeamFollowController],
  providers: [
    FollowEntityUseCase,
    UnfollowEntityUseCase,
    GetFollowStatusUseCase,
    { provide: FOLLOW_REPOSITORY, useClass: FollowRepositoryTypeorm },
    { provide: FOLLOW_SUBJECTS_REPOSITORY, useClass: FollowSubjectsRepositoryTypeorm },
  ],
})
export class SocialGraphModule {}
