import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { GetPlayerBySlugUseCase } from "../app/usecases/get-player-by-slug.usecase";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { OptionalAuthGuard } from "@/contexts/auth/infra/guards/optional-auth.guard";
import { GetPlayerSocialLinksUsecase } from "../app/usecases/social-links/get-social-links.use.case";
import { UpdatePlayerSocialLinksUseCase } from "../app/usecases/social-links/update-social-links.usecase";
import { UpdatePlayerAvailabilitiesDTO, UpdatePlayerProfileDTO, UpdatePlayerSocialLinksDTO } from "@neeft-sas/shared";
import { GetPlayerBadgesUsecase } from "../app/usecases/badges/get-player-badges.usecase";
import { UpdatePlayerProfileUseCase } from "../app/usecases/update-player-profile.usecase";
import { UpdatePlayerAvailabilitiesUseCase } from "../app/usecases/availabilities/update-availabilities.usecase";
import { Request } from "express";

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

    private readonly getPlayerSocialLinksUseCase: GetPlayerSocialLinksUsecase,
    private readonly updatePlayerSocialLinksUseCase: UpdatePlayerSocialLinksUseCase,

    private readonly getPlayerBadgesUseCase: GetPlayerBadgesUsecase,
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
