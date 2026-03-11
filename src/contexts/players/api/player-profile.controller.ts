import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { UpdatePlayerAvailabilitiesDTO, UpdatePlayerProfileRequestDto } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { GetPlayerBySlugUseCase } from "../app/usecases/get-player-by-slug.usecase";
import { UpdatePlayerProfileUseCase } from "../app/usecases/update-player-profile.usecase";
import { UpdatePlayerAvailabilitiesUseCase } from "../app/usecases/availabilities/update-availabilities.usecase";
import { GetPlayerAvailabilitiesUseCase } from "../app/usecases/availabilities/get-availabilities.usecase";
import { Request } from "express";

type JwtUser = {
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('players')
export class PlayerProfileController {
  constructor(
    private readonly getPlayerBySlugUseCase: GetPlayerBySlugUseCase,
    private readonly getPlayerAvailabilitiesUseCase: GetPlayerAvailabilitiesUseCase,
    private readonly updatePlayerProfileUseCase: UpdatePlayerProfileUseCase,
    private readonly updatePlayerAvailabilitiesUseCase: UpdatePlayerAvailabilitiesUseCase,
  ) {}

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  getPlayer(@Param('slug') slug: string) {
    return this.getPlayerBySlugUseCase.execute(slug);
  }

  @Get(':slug/availabilities')
  @HttpCode(HttpStatus.OK)
  getPlayerAvailabilities(@Param('slug') slug: string) {
    return this.getPlayerAvailabilitiesUseCase.execute(slug);
  }

  @Patch(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerProfile(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: UpdatePlayerProfileRequestDto) {
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
}
