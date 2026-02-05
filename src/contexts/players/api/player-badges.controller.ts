import { Controller, Get, HttpCode, HttpStatus, Param } from "@nestjs/common";
import { GetPlayerBadgesUsecase } from "../app/usecases/badges/get-player-badges.usecase";

@Controller('players')
export class PlayerBadgesController {
  constructor(
    private readonly getPlayerBadgesUseCase: GetPlayerBadgesUsecase,
  ) {}

  @Get(':slug/badges')
  @HttpCode(HttpStatus.OK)
  getPlayerBadges(@Param('slug') slug: string) {
    return this.getPlayerBadgesUseCase.execute(slug);
  }
}
