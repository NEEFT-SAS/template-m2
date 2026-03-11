import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CreateProfileReportDto, UpdatePlayerReportStatusDTO } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { AdminGuard } from "@/contexts/auth/infra/guards/admin.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { CreateProfileReportUseCase } from "../app/usecases/reports/create-profile-report.usecase";
import { GetPlayerReportsUseCase } from "../app/usecases/reports/get-player-reports.usecase";
import { UpdatePlayerReportStatusUseCase } from "../app/usecases/reports/update-player-report-status.usecase";
import { Request } from "express";

type JwtUser = {
  slug: string;
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('players')
export class PlayerReportsController {
  constructor(
    private readonly createProfileReportUseCase: CreateProfileReportUseCase,
    private readonly getPlayerReportsUseCase: GetPlayerReportsUseCase,
    private readonly updatePlayerReportStatusUseCase: UpdatePlayerReportStatusUseCase,
  ) {}

  @Get(':slug/reports')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  getPlayerReports(@Param('slug') slug: string) {
    return this.getPlayerReportsUseCase.execute(slug);
  }

  @Post(':slug/report')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  reportPlayer(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: CreateProfileReportDto) {
    const reporterSlug = req.user?.slug ?? '';
    return this.createProfileReportUseCase.execute(reporterSlug, 'user', slug, body);
  }

  @Patch(':slug/reports/:reportId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, AdminGuard)
  updateReportStatus(
    @Param('slug') slug: string,
    @Param('reportId') reportId: string,
    @Body() body: UpdatePlayerReportStatusDTO,
  ) {
    return this.updatePlayerReportStatusUseCase.execute(slug, reportId, body);
  }
}
