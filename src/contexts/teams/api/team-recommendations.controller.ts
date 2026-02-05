import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import { CreateTeamRecommendationDTO } from "@neeft-sas/shared";
import { ConnectedGuard } from "@/contexts/auth/infra/guards/connected.guard";
import { TeamOwnerOrAdminGuard } from "../infra/guards/team-owner-or-admin.guard";
import { Request } from "express";
import { CreateRecommendationUseCase } from "@/contexts/players/app/usecases/recommendations/create-recommendation.usecase";
import { DeleteRecommendationUseCase } from "@/contexts/players/app/usecases/recommendations/delete-recommendation.usecase";

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
  ) {}

  @Post(':slug/recommendations')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard, TeamOwnerOrAdminGuard)
  createRecommendation(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: CreateTeamRecommendationDTO) {
    const authorProfileId = req.user?.pid ?? '';
    const authorSlug = req.user?.slug ?? '';
    return this.createRecommendationUseCase.execute(authorProfileId, authorSlug, 'team', slug, body);
  }

  @Delete(':slug/recommendations/:recommendationId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, TeamOwnerOrAdminGuard)
  async deleteRecommendation(
    @Req() req: RequestWithUser,
    @Param('slug') _slug: string,
    @Param('recommendationId', ParseUUIDPipe) recommendationId: string,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    const isAdmin = Array.isArray(req.user?.roles) && req.user?.roles.includes('admin');
    await this.deleteRecommendationUseCase.execute(recommendationId, requesterProfileId, isAdmin);
    return { deleted: true };
  }

}
