import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { CreatePlayerEducationExperienceDTO, CreatePlayerExperienceDTO, CreatePlayerProfessionalExperienceDTO, UpdatePlayerEducationExperienceDTO, UpdatePlayerExperienceDTO, UpdatePlayerProfessionalExperienceDTO } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
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

@Controller('players')
export class PlayerExperiencesController {
  constructor(
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
  ) {}

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
  getPlayerEducationExperience(@Param('slug') slug: string, @Param('experienceId', ParseUUIDPipe) experienceId: string) {
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
  updatePlayerEducationExperience(@Param('slug') slug: string, @Param('experienceId', ParseUUIDPipe) experienceId: string, @Body() body: UpdatePlayerEducationExperienceDTO) {
    return this.updatePlayerEducationExperienceUseCase.execute(slug, experienceId, body);
  }

  @Delete(':slug/education-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  deletePlayerEducationExperience(@Param('slug') slug: string, @Param('experienceId', ParseUUIDPipe) experienceId: string) {
    return this.deletePlayerEducationExperienceUseCase.execute(slug, experienceId);
  }

  @Get(':slug/professional-experiences')
  @HttpCode(HttpStatus.OK)
  getPlayerProfessionalExperiences(@Param('slug') slug: string) {
    return this.getPlayerProfessionalExperiencesUseCase.execute(slug);
  }

  @Get(':slug/professional-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  getPlayerProfessionalExperience(@Param('slug') slug: string, @Param('experienceId', ParseUUIDPipe) experienceId: string) {
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
  updatePlayerProfessionalExperience(@Param('slug') slug: string, @Param('experienceId', ParseUUIDPipe) experienceId: string, @Body() body: UpdatePlayerProfessionalExperienceDTO) {
    return this.updatePlayerProfessionalExperienceUseCase.execute(slug, experienceId, body);
  }

  @Delete(':slug/professional-experiences/:experienceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  deletePlayerProfessionalExperience(@Param('slug') slug: string, @Param('experienceId', ParseUUIDPipe) experienceId: string) {
    return this.deletePlayerProfessionalExperienceUseCase.execute(slug, experienceId);
  }
}
