import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { GetPlayerBySlugUseCase } from "../app/usecases/get-player-by-slug.usecase";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { OptionalAuthGuard } from "@/contexts/auth/infra/guards/optional-auth.guard";
import { GetPlayerSocialLinksUsecase } from "../app/usecases/social-links/get-social-links.use.case";
import { UpdatePlayerSocialLinksUseCase } from "../app/usecases/social-links/update-social-links.usecase";
import { UpdatePlayerSocialLinksDTO } from "@neeft-sas/shared";

@Controller('players')
export class PlayerController {
  constructor(
    private readonly getPlayerBySlugUseCase: GetPlayerBySlugUseCase,

    private readonly getPlayerSocialLinksUseCase: GetPlayerSocialLinksUsecase,
    private readonly updatePlayerSocialLinksUseCase: UpdatePlayerSocialLinksUseCase,
  ) {}


  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  getPlayer(@Param('slug') slug: string) {
    return this.getPlayerBySlugUseCase.execute(slug);
  }

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
}