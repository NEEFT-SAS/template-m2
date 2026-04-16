import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { OptionalAuthGuard } from '@/contexts/auth/infra/guards/optional-auth.guard';
import { SearchRecruitmentsUseCase } from '../../app/usecases/search-recruitments.usecase';
import { GetRecruitmentUseCase } from '../../app/usecases/get-recruitment.usecase';
import { CreateRecruitmentUseCase } from '../../app/usecases/create-recruitment.usecase';
import { UpdateRecruitmentUseCase } from '../../app/usecases/update-recruitment.usecase';
import { DeleteRecruitmentUseCase } from '../../app/usecases/delete-recruitment.usecase';
import { ApplyToRecruitmentUseCase } from '../../app/usecases/apply-to-recruitment.usecase';
import { ListRecruitmentApplicationsUseCase } from '../../app/usecases/list-recruitment-applications.usecase';
import { UpdateRecruitmentApplicationStatusUseCase } from '../../app/usecases/update-recruitment-application-status.usecase';
import { AcceptRecruitmentApplicationUseCase } from '../../app/usecases/accept-recruitment-application.usecase';
import { RejectRecruitmentApplicationUseCase } from '../../app/usecases/reject-recruitment-application.usecase';
import { CreateRecruitmentDto } from '../dtos/create-recruitment.dto';
import { ApplyToRecruitmentDto } from '../dtos/apply-to-recruitment.dto';
import {
  RejectRecruitmentApplicationDto,
  UpdateRecruitmentApplicationStatusDto,
} from '../dtos/recruitment-application-status.dto';

type JwtUser = {
  pid: string;
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('recruitments')
export class RecruitmentController {
  constructor(
    private readonly searchRecruitments: SearchRecruitmentsUseCase,
    private readonly getRecruitment: GetRecruitmentUseCase,
    private readonly createRecruitment: CreateRecruitmentUseCase,
    private readonly updateRecruitment: UpdateRecruitmentUseCase,
    private readonly deleteRecruitment: DeleteRecruitmentUseCase,
    private readonly applyToRecruitment: ApplyToRecruitmentUseCase,
    private readonly listRecruitmentApplications: ListRecruitmentApplicationsUseCase,
    private readonly updateRecruitmentApplicationStatus: UpdateRecruitmentApplicationStatusUseCase,
    private readonly acceptRecruitmentApplication: AcceptRecruitmentApplicationUseCase,
    private readonly rejectRecruitmentApplication: RejectRecruitmentApplicationUseCase,
  ) { }

  @Get()
  @UseGuards(OptionalAuthGuard)
  search(@Req() req: RequestWithUser, @Query() query: any) {
    return this.searchRecruitments.execute(query, req.user?.pid ?? null);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.getRecruitment.execute(id, req.user?.pid ?? null);
  }

  @Post(':id/applications')
  @UseGuards(ConnectedGuard)
  apply(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ApplyToRecruitmentDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.applyToRecruitment.execute(id, requesterProfileId, dto);
  }

  @Get(':id/applications')
  @UseGuards(ConnectedGuard)
  listApplications(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.listRecruitmentApplications.execute(id, requesterProfileId);
  }

  @Patch(':id/applications/:applicationId/status')
  @UseGuards(ConnectedGuard)
  updateApplicationStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateRecruitmentApplicationStatusDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.updateRecruitmentApplicationStatus.execute(id, applicationId, requesterProfileId, dto);
  }

  @Post(':id/applications/:applicationId/status/accept')
  @UseGuards(ConnectedGuard)
  acceptApplication(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.acceptRecruitmentApplication.execute(id, applicationId, requesterProfileId);
  }

  @Post(':id/applications/:applicationId/status/reject')
  @UseGuards(ConnectedGuard)
  rejectApplication(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: RejectRecruitmentApplicationDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.rejectRecruitmentApplication.execute(id, applicationId, requesterProfileId, dto);
  }

  @Post('teams/:teamId')
  @UseGuards(ConnectedGuard)
  create(
    @Req() req: RequestWithUser,
    @Param('teamId') teamId: string,
    @Body() dto: CreateRecruitmentDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.createRecruitment.execute(requesterProfileId, teamId, dto);
  }

  @Patch(':id')
  @UseGuards(ConnectedGuard)
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateRecruitmentDto>,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.updateRecruitment.execute(requesterProfileId, id, dto);
  }

  @Delete(':id')
  @UseGuards(ConnectedGuard)
  delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.deleteRecruitment.execute(requesterProfileId, id);
  }
}
