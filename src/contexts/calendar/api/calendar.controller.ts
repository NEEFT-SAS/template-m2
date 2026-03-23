import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateCalendarActivityDTO } from './dtos/create-calendar-activity.dto';
import { ListCalendarActivitiesQueryDTO } from './dtos/list-calendar-activities.query.dto';
import { CreateCalendarActivityUseCase } from '../app/usecases/create-calendar-activity.usecase';
import { ListTeamCalendarActivitiesUseCase } from '../app/usecases/list-team-calendar-activities.usecase';

type JwtUser = {
  pid: string;
};
type RequestWithUser = Request & { user?: JwtUser };

@Controller('teams/:teamSlug/calendar/activities')
export class CalendarController {
  constructor(
    private readonly createCalendarActivityUseCase: CreateCalendarActivityUseCase,
    private readonly listTeamCalendarActivitiesUseCase: ListTeamCalendarActivitiesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createActivity(
    @Param('teamSlug') teamSlug: string,
    @Req() req: RequestWithUser,
    @Body() body: CreateCalendarActivityDTO,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.createCalendarActivityUseCase.execute(teamSlug, requesterProfileId, body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  listPublicActivities(
    @Param('teamSlug') teamSlug: string,
    @Query() query: ListCalendarActivitiesQueryDTO,
  ) {
    return this.listTeamCalendarActivitiesUseCase.executePublic(teamSlug, query.from, query.to, query.visibility);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  listActivitiesForMember(
    @Param('teamSlug') teamSlug: string,
    @Req() req: RequestWithUser,
    @Query() query: ListCalendarActivitiesQueryDTO,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.listTeamCalendarActivitiesUseCase.executeForMember(
      teamSlug,
      requesterProfileId,
      query.from,
      query.to,
      query.visibility,
    );
  }
}
