import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentEntity } from './infra/persistence/entities/recruitment.entity';
import { RecruitmentQuestionEntity } from './infra/persistence/entities/recruitment-question.entity';
import { RecruitmentApplicationEntity } from './infra/persistence/entities/recruitment-application.entity';
import { RecruitmentAnswerEntity } from './infra/persistence/entities/recruitment-answer.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { RecruitmentController } from './api/controllers/recruitment.controller';
import { RECRUITMENT_REPOSITORY } from './app/ports/recruitment.repository.port';
import { RecruitmentRepositoryTypeorm } from './infra/persistence/repositories/recruitment.repository.typeorm';
import { SearchRecruitmentsUseCase } from './app/usecases/search-recruitments.usecase';
import { GetRecruitmentUseCase } from './app/usecases/get-recruitment.usecase';
import { CreateRecruitmentUseCase } from './app/usecases/create-recruitment.usecase';
import { UpdateRecruitmentUseCase } from './app/usecases/update-recruitment.usecase';
import { DeleteRecruitmentUseCase } from './app/usecases/delete-recruitment.usecase';
import { TeamsModule } from '@/contexts/teams/teams.module';
import { AuthModule } from '@/contexts/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruitmentEntity,
      RecruitmentQuestionEntity,
      RecruitmentApplicationEntity,
      RecruitmentAnswerEntity,
      TeamEntity,
      TeamMemberEntity,
      UserProfileEntity,
    ]),
    AuthModule,
    TeamsModule,
  ],
  controllers: [RecruitmentController],
  providers: [
    SearchRecruitmentsUseCase,
    GetRecruitmentUseCase,
    CreateRecruitmentUseCase,
    UpdateRecruitmentUseCase,
    DeleteRecruitmentUseCase,
    {
      provide: RECRUITMENT_REPOSITORY,
      useClass: RecruitmentRepositoryTypeorm,
    },
  ],
  exports: [
    SearchRecruitmentsUseCase,
    GetRecruitmentUseCase,
    CreateRecruitmentUseCase,
    UpdateRecruitmentUseCase,
    DeleteRecruitmentUseCase,
  ],
})
export class RecruitmentModule { }
