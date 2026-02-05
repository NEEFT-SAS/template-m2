import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CreatePlayerReportDTO, UpdatePlayerReportStatusDTO } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { AdminGuard } from "@/contexts/auth/infra/guards/admin.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { CreatePlayerReportUseCase } from "../app/usecases/reports/create-player-report.usecase";
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
    private readonly createPlayerReportUseCase: CreatePlayerReportUseCase,
    private readonly getPlayerReportsUseCase: GetPlayerReportsUseCase,
    private readonly updatePlayerReportStatusUseCase: UpdatePlayerReportStatusUseCase,
  ) {}

  @Get(':slug/reports')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  getPlayerReports(@Param('slug') slug: string) {
    return this.getPlayerReportsUseCase.execute(slug);
  }

  @Post(':slug/reports')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  reportPlayer(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: CreatePlayerReportDTO) {
    const reporterSlug = req.user?.slug ?? '';
    return this.createPlayerReportUseCase.execute(reporterSlug, slug, body);
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
