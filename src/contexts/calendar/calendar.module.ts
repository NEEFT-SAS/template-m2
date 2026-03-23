import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamEntity } from '../teams/infra/entities/team.entity';
import { TeamMemberEntity } from '../teams/infra/entities/team-member.entity';
import { UserProfileEntity } from '../auth/infra/persistence/entities/user-profile.entity';
import { CalendarController } from './api/calendar.controller';
import { CreateCalendarActivityUseCase } from './app/usecases/create-calendar-activity.usecase';
import { ListTeamCalendarActivitiesUseCase } from './app/usecases/list-team-calendar-activities.usecase';
import { CALENDAR_REPOSITORY } from './app/ports/calendar.repository.port';
import { CalendarRepositoryTypeorm } from './infra/persistence/repositories/calendar.repository';
import { CalendarActivityEntity } from './infra/entities/calendar-activity.entity';
import { CalendarActivityAssignmentEntity } from './infra/entities/calendar-activity-assignment.entity';
import { SendCalendarActivityCreatedEmailHandler } from './app/handlers/send-calendar-activity-created-email.handler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalendarActivityEntity,
      CalendarActivityAssignmentEntity,
      TeamEntity,
      TeamMemberEntity,
      UserProfileEntity,
    ]),
    AuthModule
  ],
  controllers: [CalendarController],
  providers: [
    CreateCalendarActivityUseCase,
    ListTeamCalendarActivitiesUseCase,
    SendCalendarActivityCreatedEmailHandler,
    { provide: CALENDAR_REPOSITORY, useClass: CalendarRepositoryTypeorm },
  ],
})
export class CalendarModule {}
