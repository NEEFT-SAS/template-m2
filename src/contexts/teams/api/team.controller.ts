import { Body, Controller, Delete, HttpCode, HttpStatus, ParseUUIDPipe, Post, Req, UseGuards, Param } from '@nestjs/common';
import { Request } from 'express';
import { CreateTeamDTO, DeleteTeamDTO } from '@neeft-sas/shared';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateTeamUseCase } from '../app/usecases/profile/create-team.usecase';
import { DeleteTeamUseCase } from '../app/usecases/profile/delete-team.usecase';
import { TeamOwnerOrAdminGuard } from '../infra/guards/team-owner-or-admin.guard';

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
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createTeam(@Req() req: RequestWithUser, @Body() body: CreateTeamDTO) {
    const ownerProfileId = req.user?.pid ?? '';
    return this.createTeamUseCase.execute(ownerProfileId, body);
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
