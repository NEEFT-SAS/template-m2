import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { CreatePlayerGameDTO, UpdatePlayerGameDTO } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { PlayerOwnerOrAdminGuard } from "../infra/guards/player-owner-or-admin.guard";
import { CreatePlayerGameUseCase } from "../app/usecases/games/create-player-game.usecase";
import { DeletePlayerGameUseCase } from "../app/usecases/games/delete-player-game.usecase";
import { GetPlayerGamesUseCase } from "../app/usecases/games/get-player-games.usecase";
import { GetPlayerGameUseCase } from "../app/usecases/games/get-player-game.usecase";
import { UpdatePlayerGameUseCase } from "../app/usecases/games/update-player-game.usecase";

@Controller('players')
export class PlayerGamesController {
  constructor(
    private readonly createPlayerGameUseCase: CreatePlayerGameUseCase,
    private readonly deletePlayerGameUseCase: DeletePlayerGameUseCase,
    private readonly getPlayerGamesUseCase: GetPlayerGamesUseCase,
    private readonly getPlayerGameUseCase: GetPlayerGameUseCase,
    private readonly updatePlayerGameUseCase: UpdatePlayerGameUseCase,
  ) {}

  @Post(':slug/games')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  addPlayerGame(@Param('slug') slug: string, @Body() body: CreatePlayerGameDTO) {
    return this.createPlayerGameUseCase.execute(slug, body);
  }

  @Get(':slug/games')
  @HttpCode(HttpStatus.OK)
  getPlayerGames(@Param('slug') slug: string) {
    return this.getPlayerGamesUseCase.execute(slug);
  }

  @Get(':slug/games/:rscGameId')
  @HttpCode(HttpStatus.OK)
  getPlayerGame(@Param('slug') slug: string, @Param('rscGameId', ParseIntPipe) rscGameId: number) {
    return this.getPlayerGameUseCase.execute(slug, rscGameId);
  }

  @Patch(':slug/games/:rscGameId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerGame(
    @Param('slug') slug: string,
    @Param('rscGameId', ParseIntPipe) rscGameId: number,
    @Body() body: UpdatePlayerGameDTO,
  ) {
    return this.updatePlayerGameUseCase.execute(slug, rscGameId, body);
  }

  @Delete(':slug/games/:rscGameId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  async deletePlayerGame(@Param('slug') slug: string, @Param('rscGameId', ParseIntPipe) rscGameId: number) {
    await this.deletePlayerGameUseCase.execute(slug, rscGameId);
    return { deleted: true };
  }
}
