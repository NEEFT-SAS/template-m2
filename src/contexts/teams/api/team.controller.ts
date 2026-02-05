import { Body, Controller, Delete, HttpCode, HttpStatus, ParseUUIDPipe, Post, Req, UseGuards, Param } from '@nestjs/common';
import { Request } from 'express';
import { CreateTeamDTO, CreateTeamMemberDTO, CreateTeamRosterDTO, CreateTeamRosterMemberDTO, DeleteTeamDTO } from '@neeft-sas/shared';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateTeamUseCase } from '../app/usecases/profile/create-team.usecase';
import { DeleteTeamUseCase } from '../app/usecases/profile/delete-team.usecase';
import { TeamOwnerOrAdminGuard } from '../infra/guards/team-owner-or-admin.guard';
import { CreateTeamMemberUseCase } from '../app/usecases/members/create-team-member.usecase';
import { CreateTeamRosterUseCase } from '../app/usecases/rosters/create-team-roster.usecase';
import { AddTeamRosterMemberUseCase } from '../app/usecases/rosters/add-team-roster-member.usecase';

type JwtUser = {
  pid: string;
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('teams')
export class TeamController {
  constructor(
    private readonly createTeamUseCase: CreateTeamUseCase,
    private readonly deleteTeamUseCase: DeleteTeamUseCase,
    private readonly createTeamMemberUseCase: CreateTeamMemberUseCase,
    private readonly createTeamRosterUseCase: CreateTeamRosterUseCase,
    private readonly addTeamRosterMemberUseCase: AddTeamRosterMemberUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createTeam(@Req() req: RequestWithUser, @Body() body: CreateTeamDTO) {
    const ownerProfileId = req.user?.pid ?? '';
    return this.createTeamUseCase.execute(ownerProfileId, body);
  }

  @Post(':teamId/members')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  addTeamMember(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: CreateTeamMemberDTO,
  ) {
    return this.createTeamMemberUseCase.execute(teamId, body);
  }

  @Post(':teamId/rosters')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createRoster(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: CreateTeamRosterDTO,
  ) {
    return this.createTeamRosterUseCase.execute(teamId, body);
  }

  @Post(':teamId/rosters/:rosterId/members')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  addRosterMember(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('rosterId', ParseUUIDPipe) rosterId: string,
    @Body() body: CreateTeamRosterMemberDTO,
  ) {
    return this.addTeamRosterMemberUseCase.execute(teamId, rosterId, body);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, TeamOwnerOrAdminGuard)
  async deleteTeam(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: DeleteTeamDTO,
  ) {
    await this.deleteTeamUseCase.execute(teamId, body);
    return { deleted: true };
  }
}
