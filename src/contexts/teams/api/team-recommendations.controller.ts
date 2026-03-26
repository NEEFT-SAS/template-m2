import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CreateTeamRecommendationDTO, PlayerRecommendationsQueryDto } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { OptionalAuthGuard } from "@/contexts/auth/infra/guards/optional-auth.guard";
import { Request } from "express";
import { CreateRecommendationUseCase } from "@/contexts/players/app/usecases/recommendations/create-recommendation.usecase";
import { DeleteRecommendationUseCase } from "@/contexts/players/app/usecases/recommendations/delete-recommendation.usecase";
import { ListPlayerReceivedRecommendationsUseCase } from "@/contexts/players/app/usecases/recommendations/list-player-received-recommendations.usecase";
import { ListPlayerGivenRecommendationsUseCase } from "@/contexts/players/app/usecases/recommendations/list-player-given-recommendations.usecase";
import { TeamOwnerOrAdminGuard } from "../infra/guards/team-owner-or-admin.guard";

type JwtUser = {
  pid?: string;
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('teams')
export class TeamRecommendationsController {
  constructor(
    private readonly createRecommendationUseCase: CreateRecommendationUseCase,
    private readonly deleteRecommendationUseCase: DeleteRecommendationUseCase,
    private readonly listPlayerReceivedRecommendationsUseCase: ListPlayerReceivedRecommendationsUseCase,
    private readonly listPlayerGivenRecommendationsUseCase: ListPlayerGivenRecommendationsUseCase,
  ) {}

  @Post(':slug/recommendations')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createRecommendation(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: CreateTeamRecommendationDTO) {
    const authorProfileId = req.user?.pid ?? '';
    const authorSlug = req.user?.slug ?? '';
    return this.createRecommendationUseCase.execute(authorProfileId, authorSlug, 'team', slug, body);
  }

  @Get(':slug/recommendations/received')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  listReceivedRecommendations(
    @Req() req: RequestWithUser,
    @Param('slug') slug: string,
    @Query() query: PlayerRecommendationsQueryDto,
  ) {
    return this.listPlayerReceivedRecommendationsUseCase.execute(
      slug,
      { page: query.page ?? 1, perPage: query.perPage ?? 20 },
      req.user,
      'team',
    );
  }

  @Get(':slug/recommendations/given')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  listGivenRecommendations(
    @Req() req: RequestWithUser,
    @Param('slug') slug: string,
    @Query() query: PlayerRecommendationsQueryDto,
  ) {
    return this.listPlayerGivenRecommendationsUseCase.execute(
      slug,
      { page: query.page ?? 1, perPage: query.perPage ?? 20 },
      req.user,
      'team',
    );
  }

  @Delete(':slug/recommendations/:recommendationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, TeamOwnerOrAdminGuard)
  async deleteRecommendation(@Req() req: RequestWithUser,@Param('slug') _slug: string,@Param('recommendationId', ParseUUIDPipe) recommendationId: string) {
    const requesterProfileId = req.user?.pid ?? '';
    const isAdmin = Array.isArray(req.user?.roles) && req.user?.roles.includes('admin');
    await this.deleteRecommendationUseCase.execute(recommendationId, requesterProfileId, isAdmin);
    return { deleted: true };
  }

}
