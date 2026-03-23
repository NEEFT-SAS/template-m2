import { Body, Controller, Delete, Get, HttpCode, HttpStatus, ParseUUIDPipe, Post, Req, UseGuards, Param, Patch } from '@nestjs/common';
import { Request } from 'express';
import { CreateTeamMemberDTO, RestoreTeamMemberDto, UpdateTeamMemberDTO } from '@neeft-sas/shared';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateTeamMemberUseCase } from '../app/usecases/members/create-team-member.usecase';
import { GetTeamMembersUseCase } from '../app/usecases/members/get-team-members.usecase';
import { UpdateTeamMemberUseCase } from '../app/usecases/members/update-team-member.usecase';
import { DeleteTeamMemberUseCase } from '../app/usecases/members/delete-team-member.usecase';
import { OptionalAuthGuard } from '@/contexts/auth/infra/guards/optional-auth.guard';
import { RestoreTeamMemberUseCase } from '../app/usecases/members/restore-team-member.usecase';

type JwtUser = {
  pid: string;
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('teams/:slug/members')
export class TeamMembersController {
  constructor(
    private readonly getTeamMembersUseCase: GetTeamMembersUseCase,
    private readonly createTeamMemberUseCase: CreateTeamMemberUseCase,
    private readonly updateTeamMemberUseCase: UpdateTeamMemberUseCase,
    private readonly deleteTeamMemberUseCase: DeleteTeamMemberUseCase,
    private readonly restoreTeamMemberUseCase: RestoreTeamMemberUseCase,

  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createTeamMember(@Req() req: RequestWithUser, @Param('slug') teamSlug: string, @Body() body: CreateTeamMemberDTO) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.createTeamMemberUseCase.execute(teamSlug, body, requesterProfileId);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  async getTeamMembers(@Req() req: RequestWithUser, @Param('slug') teamSlug: string) {
    const requesterProfileId = req.user?.pid ?? '';
    const members = await this.getTeamMembersUseCase.execute(teamSlug, requesterProfileId);
    return members;
  }

  @Patch(':memberId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  updateTeamMember(
    @Param('slug') teamSlug: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Req() req: RequestWithUser,
    @Body() body: UpdateTeamMemberDTO,
  ) {
    const requestProfileId = req.user.pid ?? '';
    return this.updateTeamMemberUseCase.execute(teamSlug, memberId, body, requestProfileId);
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  async deleteTeamMember(
    @Param('slug') teamSlug: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Req() req: RequestWithUser,
  ) {
    const requesterProfileId = req.user.pid ?? '';
    await this.deleteTeamMemberUseCase.execute(teamSlug, memberId, requesterProfileId);
    return { deleted: true };
  }

  @Post(':memberId/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  async restoreTeamMember(
    @Param('slug') teamSlug: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() body: RestoreTeamMemberDto,
    @Req() req: RequestWithUser,
  ) {
    const requesterProfileId = req.user.pid ?? '';
    body.memberId = memberId;
    const presenter = await this.restoreTeamMemberUseCase.execute(teamSlug, body, requesterProfileId);
    return presenter;
  }

}
