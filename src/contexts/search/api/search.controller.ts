import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { OptionalAuthGuard } from '@/contexts/auth/infra/guards/optional-auth.guard';
import { AdminGuard } from '@/contexts/auth/infra/guards/admin.guard';
import { AccessTokenPayload } from '@/contexts/auth/app/ports/token.port';
import { SearchPlayersQueryDto, SearchTeamsQueryDto } from '@neeft-sas/shared';
import { SearchPlayersQuery } from '../app/queries/search-players.query';
import { SearchTeamsQuery } from '../app/queries/search-teams.query';
import { PlayerSearchIndexer } from '../infra/typesense/player-search.indexer';

type RequestWithUser = Request & { user?: AccessTokenPayload };

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchPlayersQuery: SearchPlayersQuery,
    private readonly searchTeamsQuery: SearchTeamsQuery,
    private readonly playerSearchIndexer: PlayerSearchIndexer,
  ) {}

  @Get('players')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  searchPlayers(@Req() req: RequestWithUser, @Query() query: SearchPlayersQueryDto) {
    return this.searchPlayersQuery.execute(query, req.user);
  }

  @Get('teams')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  searchTeams(@Query() query: SearchTeamsQueryDto) {
    return this.searchTeamsQuery.execute(query);
  }

  @Post('players/index')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  syncPlayersIndex() {
    return this.playerSearchIndexer.syncAll();
  }

  @Post('players/:slug/index')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, AdminGuard)
  syncPlayerIndex(@Param('slug') slug: string) {
    return this.playerSearchIndexer.syncBySlug(slug);
  }
}
