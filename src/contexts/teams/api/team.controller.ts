import { Body, Controller, Delete, Get, HttpCode, HttpStatus, ParseUUIDPipe, Post, Req, UseGuards, Param, Patch } from '@nestjs/common';
import { Request } from 'express';
import { CreateTeamMemberDTO, CreateTeamRosterDTO, CreateTeamRosterMemberDTO } from '@neeft-sas/shared';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateTeamUseCase } from '../app/usecases/profile/create-team.usecase';
import { DeleteTeamUseCase } from '../app/usecases/profile/delete-team.usecase';
import { TeamOwnerOrAdminGuard } from '../infra/guards/team-owner-or-admin.guard';
import { CreateTeamMemberUseCase } from '../app/usecases/members/create-team-member.usecase';
import { CreateTeamRosterUseCase } from '../app/usecases/rosters/create-team-roster.usecase';
import { AddTeamRosterMemberUseCase } from '../app/usecases/rosters/add-team-roster-member.usecase';
import { UpdateTeamUseCase } from '../app/usecases/profile/update-team.usecase';
import { CreateTeamDTO, DeleteTeamDTO, UpdateTeamDTO } from '@/typage';
import { GetTeamProfileUseCase } from '../app/usecases/profile/get-team-profile.usecase';
import { GetPlayerTeamsUseCase } from '../app/usecases/get-player-team.usecase';

type JwtUser = {
  pid: string;
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('teams')
export class TeamController {
  constructor(
    private readonly getTeamProfileUseCase: GetTeamProfileUseCase,
    private readonly createTeamUseCase: CreateTeamUseCase,
    private readonly updateTeamUseCase: UpdateTeamUseCase,
    private readonly deleteTeamUseCase: DeleteTeamUseCase,
    private readonly createTeamMemberUseCase: CreateTeamMemberUseCase,
    private readonly createTeamRosterUseCase: CreateTeamRosterUseCase,
    private readonly addTeamRosterMemberUseCase: AddTeamRosterMemberUseCase,
    private readonly getPlayerTeamsUseCase: GetPlayerTeamsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createTeam(@Req() req: RequestWithUser, @Body() body: CreateTeamDTO) {
    const ownerProfileId = req.user?.pid ?? '';
    return this.createTeamUseCase.execute(ownerProfileId, body);
  }

  @Get('/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  async getMyTeams(@Req() req: RequestWithUser) {
    const requesterProfileId = req.user?.pid ?? '';
    const teams = await this.getPlayerTeamsUseCase.execute(requesterProfileId);
    return teams
  }

  @Get(':slug/private')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  getTeamPrivateProfile(@Req() req: RequestWithUser, @Param('slug') slug: string) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getTeamProfileUseCase.executePrivate(slug, requesterProfileId);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  getTeamProfile(@Param('slug') slug: string) {
    return this.getTeamProfileUseCase.execute(slug);
  }

  @Patch(':teamId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, TeamOwnerOrAdminGuard)
  updateTeam(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Body() body: UpdateTeamDTO,
  ) {
    return this.updateTeamUseCase.execute(teamId, body);
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
