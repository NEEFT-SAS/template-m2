import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { GetPlayerBySlugUseCase } from "../app/usecases/get-player-by-slug.usecase";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { AdminGuard } from "@/contexts/auth/infra/guards/admin.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { OptionalAuthGuard } from "@/contexts/auth/infra/guards/optional-auth.guard";
import { GetPlayerSocialLinksUsecase } from "../app/usecases/social-links/get-social-links.use.case";
import { UpdatePlayerSocialLinksUseCase } from "../app/usecases/social-links/update-social-links.usecase";
import { CreatePlayerEducationExperienceDTO, CreatePlayerExperienceDTO, CreatePlayerProfessionalExperienceDTO, CreatePlayerReportDTO, UpdatePlayerAvailabilitiesDTO, UpdatePlayerEducationExperienceDTO, UpdatePlayerExperienceDTO, UpdatePlayerProfessionalExperienceDTO, UpdatePlayerProfileDTO, UpdatePlayerReportStatusDTO, UpdatePlayerSocialLinksDTO } from "@neeft-sas/shared";
import { GetPlayerBadgesUsecase } from "../app/usecases/badges/get-player-badges.usecase";
import { UpdatePlayerProfileUseCase } from "../app/usecases/update-player-profile.usecase";
import { UpdatePlayerAvailabilitiesUseCase } from "../app/usecases/availabilities/update-availabilities.usecase";
import { AddPlayerExperienceUseCase } from "../app/usecases/experiences/add-experience.usecase";
import { GetPlayerExperiencesUseCase } from "../app/usecases/experiences/get-experiences.usecase";
import { GetPlayerExperienceUseCase } from "../app/usecases/experiences/get-experience.usecase";
import { UpdatePlayerExperienceUseCase } from "../app/usecases/experiences/update-experience.usecase";
import { DeletePlayerExperienceUseCase } from "../app/usecases/experiences/delete-experience.usecase";
import { AddPlayerEducationExperienceUseCase } from "../app/usecases/experiences/add-education-experience.usecase";
import { GetPlayerEducationExperiencesUseCase } from "../app/usecases/experiences/get-education-experiences.usecase";
import { GetPlayerEducationExperienceUseCase } from "../app/usecases/experiences/get-education-experience.usecase";
import { UpdatePlayerEducationExperienceUseCase } from "../app/usecases/experiences/update-education-experience.usecase";
import { DeletePlayerEducationExperienceUseCase } from "../app/usecases/experiences/delete-education-experience.usecase";
import { AddPlayerProfessionalExperienceUseCase } from "../app/usecases/experiences/add-professional-experience.usecase";
import { GetPlayerProfessionalExperiencesUseCase } from "../app/usecases/experiences/get-professional-experiences.usecase";
import { GetPlayerProfessionalExperienceUseCase } from "../app/usecases/experiences/get-professional-experience.usecase";
import { UpdatePlayerProfessionalExperienceUseCase } from "../app/usecases/experiences/update-professional-experience.usecase";
import { DeletePlayerProfessionalExperienceUseCase } from "../app/usecases/experiences/delete-professional-experience.usecase";
import { Request } from "express";
import { CreatePlayerReportUseCase } from "../app/usecases/reports/create-player-report.usecase";
import { GetPlayerReportsUseCase } from "../app/usecases/reports/get-player-reports.usecase";
import { UpdatePlayerReportStatusUseCase } from "../app/usecases/reports/update-player-report-status.usecase";

type JwtUser = {
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('players')
export class PlayerController {
  constructor(
    private readonly getPlayerBySlugUseCase: GetPlayerBySlugUseCase,
    private readonly updatePlayerProfileUseCase: UpdatePlayerProfileUseCase,
    private readonly updatePlayerAvailabilitiesUseCase: UpdatePlayerAvailabilitiesUseCase,

    private readonly addPlayerExperienceUseCase: AddPlayerExperienceUseCase,
    private readonly getPlayerExperiencesUseCase: GetPlayerExperiencesUseCase,
    private readonly getPlayerExperienceUseCase: GetPlayerExperienceUseCase,
    private readonly updatePlayerExperienceUseCase: UpdatePlayerExperienceUseCase,
    private readonly deletePlayerExperienceUseCase: DeletePlayerExperienceUseCase,

    private readonly addPlayerEducationExperienceUseCase: AddPlayerEducationExperienceUseCase,
    private readonly getPlayerEducationExperiencesUseCase: GetPlayerEducationExperiencesUseCase,
    private readonly getPlayerEducationExperienceUseCase: GetPlayerEducationExperienceUseCase,
    private readonly updatePlayerEducationExperienceUseCase: UpdatePlayerEducationExperienceUseCase,
    private readonly deletePlayerEducationExperienceUseCase: DeletePlayerEducationExperienceUseCase,

    private readonly addPlayerProfessionalExperienceUseCase: AddPlayerProfessionalExperienceUseCase,
    private readonly getPlayerProfessionalExperiencesUseCase: GetPlayerProfessionalExperiencesUseCase,
    private readonly getPlayerProfessionalExperienceUseCase: GetPlayerProfessionalExperienceUseCase,
    private readonly updatePlayerProfessionalExperienceUseCase: UpdatePlayerProfessionalExperienceUseCase,
    private readonly deletePlayerProfessionalExperienceUseCase: DeletePlayerProfessionalExperienceUseCase,

    private readonly getPlayerSocialLinksUseCase: GetPlayerSocialLinksUsecase,
    private readonly updatePlayerSocialLinksUseCase: UpdatePlayerSocialLinksUseCase,

    private readonly getPlayerBadgesUseCase: GetPlayerBadgesUsecase,

    private readonly createPlayerReportUseCase: CreatePlayerReportUseCase,
    private readonly getPlayerReportsUseCase: GetPlayerReportsUseCase,
    private readonly updatePlayerReportStatusUseCase: UpdatePlayerReportStatusUseCase,
  ) {}


  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  getPlayer(@Param('slug') slug: string) {
    return this.getPlayerBySlugUseCase.execute(slug);
  }

  @Patch(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerProfile(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: UpdatePlayerProfileDTO) {
    const user = req.user;
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes('admin');
    return this.updatePlayerProfileUseCase.execute(slug, body, isAdmin);
  }

  @Patch(':slug/availabilities')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerAvailabilities(@Param('slug') slug: string, @Body() body: UpdatePlayerAvailabilitiesDTO) {
    return this.updatePlayerAvailabilitiesUseCase.execute(slug, body.availabilities);
  }

  /*************
   * Experiences
   */
  @Get(':slug/esport-experiences')
  @HttpCode(HttpStatus.OK)
  getPlayerExperiences(@Param('slug') slug: string) {
    return this.getPlayerExperiencesUseCase.execute(slug);
  }

  @Get(':slug/esport-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  getPlayerExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number) {
    return this.getPlayerExperienceUseCase.execute(slug, experienceId);
  }

  @Post(':slug/esport-experiences')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  addPlayerExperience(@Param('slug') slug: string, @Body() body: CreatePlayerExperienceDTO) {
    return this.addPlayerExperienceUseCase.execute(slug, body);
  }

  @Patch(':slug/esport-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number, @Body() body: UpdatePlayerExperienceDTO) {
    return this.updatePlayerExperienceUseCase.execute(slug, experienceId, body);
  }

  @Delete(':slug/esport-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  async deletePlayerExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number) {
    await this.deletePlayerExperienceUseCase.execute(slug, experienceId);
    return { deleted: true };
  }

  @Get(':slug/education-experiences')
  @HttpCode(HttpStatus.OK)
  getPlayerEducationExperiences(@Param('slug') slug: string) {
    return this.getPlayerEducationExperiencesUseCase.execute(slug);
  }

  @Get(':slug/education-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  getPlayerEducationExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number) {
    return this.getPlayerEducationExperienceUseCase.execute(slug, experienceId);
  }

  @Post(':slug/education-experiences')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  addPlayerEducationExperience(@Param('slug') slug: string, @Body() body: CreatePlayerEducationExperienceDTO) {
    return this.addPlayerEducationExperienceUseCase.execute(slug, body);
  }

  @Patch(':slug/education-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerEducationExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number, @Body() body: UpdatePlayerEducationExperienceDTO) {
    return this.updatePlayerEducationExperienceUseCase.execute(slug, experienceId, body);
  }

  @Delete(':slug/education-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  deletePlayerEducationExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number) {
    return this.deletePlayerEducationExperienceUseCase.execute(slug, experienceId);
  }

  @Get(':slug/professional-experiences')
  @HttpCode(HttpStatus.OK)
  getPlayerProfessionalExperiences(@Param('slug') slug: string) {
    return this.getPlayerProfessionalExperiencesUseCase.execute(slug);
  }

  @Get(':slug/professional-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  getPlayerProfessionalExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number) {
    return this.getPlayerProfessionalExperienceUseCase.execute(slug, experienceId);
  }

  @Post(':slug/professional-experiences')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  addPlayerProfessionalExperience(@Param('slug') slug: string, @Body() body: CreatePlayerProfessionalExperienceDTO) {
    return this.addPlayerProfessionalExperienceUseCase.execute(slug, body);
  }

  @Patch(':slug/professional-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerProfessionalExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number, @Body() body: UpdatePlayerProfessionalExperienceDTO) {
    return this.updatePlayerProfessionalExperienceUseCase.execute(slug, experienceId, body);
  }

  @Delete(':slug/professional-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  deletePlayerProfessionalExperience(@Param('slug') slug: string, @Param('experienceId', ParseIntPipe) experienceId: number) {
    return this.deletePlayerProfessionalExperienceUseCase.execute(slug, experienceId);
  }

  /********
   * Reports
   */
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

  /********
   * Social Links
   */
  @Get(':slug/socials')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  getPlayerSocialLinks(@Param('slug') slug: string) {
    return this.getPlayerSocialLinksUseCase.execute(slug);
  }

  @Post(':slug/socials')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerSocialLinks(@Param('slug') slug: string, @Body() body: UpdatePlayerSocialLinksDTO) {
    return this.updatePlayerSocialLinksUseCase.execute(slug, body.links);
  }

  /*******
   * Badges
   */
  @Get(':slug/badges')
  @HttpCode(HttpStatus.OK)
  getPlayerBadges(@Param('slug') slug: string) {
    return this.getPlayerBadgesUseCase.execute(slug);
  }
}
